import Phaser from 'phaser';

/**
 * PopupManager — Reusable, localized, multi-page popup overlay for any Phaser scene.
 *
 * Supports two modes:
 *   1. SINGLE-PAGE (backward compatible):
 *      popup.show({ title: {...}, body: {...}, slot1: '...', ... })
 *
 *   2. MULTI-PAGE (JSON-driven):
 *      import data from './popups/welcome_guest.json';
 *      popup.show(data);   // data = { pages: [ {...}, {...} ] }
 *
 * Slot shorthand:
 *   'texture_key'                         → { idle: 'texture_key' }
 *   ['frame1', 'frame2']                  → { idle: ['frame1', 'frame2'] }
 *   { idle: '...' | [...], frameRate: N } → full form
 *   null / omitted                        → no character
 */
export default class PopupManager {
    constructor(scene) {
        this.scene = scene;
        this.overlay = null;       // persistent: blocker + panel shell
        this.contentLayer = null;  // cleared & rebuilt per page
        this.navLayer = null;      // page dots + arrows
        this.videoEl = null;
        this.slotTimers = [];
        this._pages = [];
        this._currentPage = 0;
        this._config = null;
        this._panelBounds = null;  // { cx, cy, panelW, panelH }
    }

    // ═══════════════════════════════════════════════════════
    //  PUBLIC API
    // ═══════════════════════════════════════════════════════

    /**
     * Show a popup. Accepts single-page config or multi-page { pages: [...] }.
     */
    show(config) {
        if (this.overlay) this.hide();

        this._config = config;
        const { width, height } = this.scene.scale;
        const BASE_DEPTH = 30000;

        // Normalize to pages array
        if (config.pages && Array.isArray(config.pages)) {
            this._pages = config.pages;
        } else {
            // Single-page legacy format → wrap in array
            this._pages = [config];
        }
        this._currentPage = 0;

        // ── 1. FULLSCREEN INPUT BLOCKER ──
        this.overlay = this.scene.add.container(0, 0).setDepth(BASE_DEPTH);

        const blocker = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
            .setInteractive(); // Swallows all pointer events

        // NEW: Click anywhere on the dark background to close
        blocker.on('pointerdown', () => this.hide());
        this.overlay.add(blocker);

        // ── 2. PANEL SHELL (persists across pages) ──
        const panelW = Math.min(520, width * 0.45);
        const panelH = 500; // Temporary placeholder, will be dynamically sized in _renderPage
        const cx = width / 2;
        const cy = height / 2;
        this._panelBounds = { cx, cy, panelW, panelH, width, height };

        this.panelBg = this.scene.add.rectangle(cx, cy, panelW, panelH, 0x1a1a2e)
            .setStrokeStyle(3, 0x6c63ff);
        this.overlay.add(this.panelBg);

        this.innerPanelBg = this.scene.add.rectangle(cx, cy, panelW - 6, panelH - 6, 0x1a1a2e);
        this.overlay.add(this.innerPanelBg);

        // ── 3. CLOSE BUTTON (persists) ──
        const closeX = cx + panelW / 2 - 30;
        const closeY = cy - panelH / 2 + 30;
        this.closeBtn = this.scene.add.text(closeX, closeY, '✕', {
            fontSize: '32px', color: '#ff6666', fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.closeBtn.on('pointerover', () => this.closeBtn.setColor('#ff9999'));
        this.closeBtn.on('pointerout', () => this.closeBtn.setColor('#ff6666'));
        this.closeBtn.on('pointerdown', () => this.hide());
        this.overlay.add(this.closeBtn);

        // ── 4. CONTENT + NAV LAYERS ──
        this.contentLayer = this.scene.add.container(0, 0).setDepth(BASE_DEPTH + 1);
        this.overlay.add(this.contentLayer);

        // ── 5. RENDER FIRST PAGE ──
        this._renderPage(0);

        // ── 6. NAVIGATION (if multi-page) ──
        if (this._pages.length > 1) {
            this.navLayer = this.scene.add.container(0, 0).setDepth(BASE_DEPTH + 3);
            this.overlay.add(this.navLayer);
            this._renderNavigation();
        }

        // ── 7. ENTRANCE ANIMATION ──
        this.overlay.setAlpha(0);
        this.scene.tweens.add({
            targets: this.overlay,
            alpha: 1,
            duration: 250,
            ease: 'Sine.easeOut'
        });
    }

    /** Hide and destroy the popup. */
    hide() {
        this._clearPageContent();

        if (this.overlay) {
            this.scene.tweens.add({
                targets: this.overlay,
                alpha: 0,
                duration: 200,
                ease: 'Sine.easeIn',
                onComplete: () => {
                    if (this.overlay) {
                        this.overlay.destroy();
                        this.overlay = null;
                    }
                    this.contentLayer = null;
                    this.navLayer = null;
                    if (this._config && this._config.onClose) {
                        this._config.onClose();
                    }
                    this._config = null;
                    this._pages = [];
                }
            });
        }
    }

    /** Navigate to a specific page. */
    goToPage(index) {
        if (index < 0 || index >= this._pages.length || index === this._currentPage) return;
        this._currentPage = index;
        this._clearPageContent();

        // Crossfade: fade out old, render new, fade in
        if (this.contentLayer) {
            this.contentLayer.setAlpha(0);
            this._renderPage(index);
            this.scene.tweens.add({
                targets: this.contentLayer,
                alpha: 1,
                duration: 200,
                ease: 'Sine.easeOut'
            });
        }
        if (this.navLayer) this._renderNavigation();
    }

    nextPage() { this.goToPage(this._currentPage + 1); }
    prevPage() { this.goToPage(this._currentPage - 1); }

    isVisible() { return this.overlay !== null; }
    destroy() { this.hide(); }

    // ═══════════════════════════════════════════════════════
    //  PAGE RENDERING
    // ═══════════════════════════════════════════════════════

    _renderPage(index) {
        const page = this._pages[index];
        if (!page) return;

        const lang = this.scene.registry.get('currentLanguage') || 'en';
        const { cx, cy, panelW, width, height } = this._panelBounds;
        const slotW = Math.min(200, width * 0.18);
        const maxTextWidth = panelW - 60;

        // --- 1. BUILD CONTENT AND MEASURE ---
        let currentY = 0; // Local measurement cursor
        const pageElements = [];
        const videoElements = [];

        // ── TITLE ──
        if (page.title) {
            const titleStr = this._localize(page.title, lang);
            const title = this.scene.add.text(cx, currentY, titleStr, {
                fontFamily: '"Luckiest Guy", cursive',
                fontSize: '36px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center',
                wordWrap: { width: maxTextWidth }
            }).setOrigin(0.5, 0);
            this.contentLayer.add(title);
            pageElements.push(title);
            currentY += title.height + 20;
        }

        // ── BODY ──
        if (page.body) {
            const bodyStr = this._localize(page.body, lang);
            const body = this.scene.add.text(cx, currentY, bodyStr, {
                fontFamily: 'Nunito, sans-serif',
                fontSize: '22px',
                color: '#dddddd',
                align: 'center',
                wordWrap: { width: maxTextWidth },
                lineSpacing: 6
            }).setOrigin(0.5, 0);
            this.contentLayer.add(body);
            pageElements.push(body);
            currentY += body.height + 20;
        }

        // ── IMAGE ──
        if (page.image && this.scene.textures.exists(page.image)) {
            const img = this.scene.add.image(cx, currentY + 10, page.image).setOrigin(0.5, 0);
            const maxImgW = maxTextWidth;
            const maxImgH = 150;
            const imgScale = Math.min(maxImgW / img.width, maxImgH / img.height, 1);
            img.setScale(imgScale);
            this.contentLayer.add(img);
            pageElements.push(img);
            currentY += img.height * imgScale + 20;
        }

        // ── VIDEO ──
        if (page.video) {
            videoElements.push({ url: page.video, y: currentY, maxW: maxTextWidth, h: 160 });
            currentY += 170;
        }

        // ── LINKS ──
        if (page.links && page.links.length > 0) {
            page.links.forEach((link) => {
                const labelStr = this._localize(link.label, lang);
                currentY += 5;
                const { btn, txt } = this._createLinkButton(cx, currentY, labelStr, link.url, maxTextWidth);
                pageElements.push(btn, txt);
                currentY += 45;
            });
        }

        // ── AUDIO ──
        if (page.audio && this.scene.cache.audio.exists(page.audio)) {
            this.scene.sound.play(page.audio, { volume: 0.5 });
        }

        // --- 2. DYNAMIC PANEL RESIZE ---
        // Calculate minimal panel height based on content + some padding at bottom.
        // If there's multiple pages, add explicit room for navigation dots (40px)
        const hasNav = (this._pages.length > 1);
        const paddingBottom = hasNav ? 70 : 40;
        let dHeight = Math.max(200, currentY + paddingBottom);

        // Safety cap
        dHeight = Math.min(dHeight, height * 0.9);

        // Apply resizing
        if (this.panelBg) this.panelBg.setSize(panelW, dHeight);
        if (this.innerPanelBg) this.innerPanelBg.setSize(panelW - 6, dHeight - 6);

        // Reposition Close Button
        if (this.closeBtn) {
            this.closeBtn.setPosition(cx + panelW / 2 - 30, cy - dHeight / 2 + 30);
        }

        // Overwrite the global bounds definition so navigation places itself at the new bottom
        this._panelBounds.panelH = dHeight;

        // --- 3. FINAL COMPONENT PLACEMENT ---
        // Now that the panel is perfectly sized around the content, we shift all generated contents  
        // down so they start exactly inside the new top margin.
        const startY = cy - dHeight / 2 + 40;

        pageElements.forEach(el => {
            el.y += startY;
        });

        // DOM Video gets special coordinate rules
        videoElements.forEach(v => {
            this._createVideoOverlay(v.url, cx, v.y + startY, v.maxW, v.h);
        });

        // ── SLOTS ── (Side Characters)
        if (page.slot1) {
            this._createSlot(page.slot1, cx - panelW / 2 - slotW / 2 - 10, cy, slotW, dHeight);
        }
        if (page.slot2) {
            this._createSlot(page.slot2, cx + panelW / 2 + slotW / 2 + 10, cy, slotW, dHeight);
        }
    }

    _clearPageContent() {
        // Stop slot animations
        this.slotTimers.forEach(t => { if (t) t.remove(); });
        this.slotTimers = [];

        // Remove DOM video
        if (this.videoEl) {
            this.videoEl.pause();
            this.videoEl.remove();
            this.videoEl = null;
        }

        // Clear content layer children (but keep the container itself)
        if (this.contentLayer) {
            this.contentLayer.removeAll(true);
        }
    }

    // ═══════════════════════════════════════════════════════
    //  NAVIGATION
    // ═══════════════════════════════════════════════════════

    _renderNavigation() {
        if (!this.navLayer) return;
        this.navLayer.removeAll(true);

        const { cx, cy, panelH } = this._panelBounds;
        const navY = cy + panelH / 2 - 35;
        const totalPages = this._pages.length;
        const current = this._currentPage;

        // ── PAGE DOTS ──
        const dotSpacing = 22;
        const dotsStartX = cx - ((totalPages - 1) * dotSpacing) / 2;

        for (let i = 0; i < totalPages; i++) {
            const dotX = dotsStartX + i * dotSpacing;
            const isActive = i === current;
            const dot = this.scene.add.circle(dotX, navY, isActive ? 7 : 5,
                isActive ? 0x6c63ff : 0x555555
            ).setInteractive({ useHandCursor: true });
            dot.on('pointerdown', () => this.goToPage(i));
            this.navLayer.add(dot);
        }

        // ── ARROWS ──
        const arrowOffset = Math.max(80, (totalPages * dotSpacing) / 2 + 40);

        if (current > 0) {
            const prevBtn = this.scene.add.text(cx - arrowOffset, navY, '◀', {
                fontSize: '28px', color: '#ffffff'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            prevBtn.on('pointerover', () => prevBtn.setColor('#6c63ff'));
            prevBtn.on('pointerout', () => prevBtn.setColor('#ffffff'));
            prevBtn.on('pointerdown', () => this.prevPage());
            this.navLayer.add(prevBtn);
        }

        if (current < totalPages - 1) {
            const nextBtn = this.scene.add.text(cx + arrowOffset, navY, '▶', {
                fontSize: '28px', color: '#ffffff'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            nextBtn.on('pointerover', () => nextBtn.setColor('#6c63ff'));
            nextBtn.on('pointerout', () => nextBtn.setColor('#ffffff'));
            nextBtn.on('pointerdown', () => this.nextPage());
            this.navLayer.add(nextBtn);
        }
    }

    // ═══════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════

    _localize(value, lang) {
        if (!value) return '';
        if (typeof value === 'string') return value;
        return value[lang] || value['en'] || '';
    }

    /**
     * Normalize slot shorthand into { idle: [...], frameRate }.
     */
    _normalizeSlotConfig(slotConfig) {
        if (typeof slotConfig === 'string') {
            return { idle: [slotConfig], frameRate: 600 };
        }
        if (Array.isArray(slotConfig)) {
            return { idle: slotConfig, frameRate: 600 };
        }
        if (slotConfig && typeof slotConfig === 'object') {
            const idle = Array.isArray(slotConfig.idle) ? slotConfig.idle : [slotConfig.idle];
            return { idle, frameRate: slotConfig.frameRate || 600 };
        }
        return null;
    }

    _createSlot(slotConfig, x, y, maxW, maxH) {
        const normalized = this._normalizeSlotConfig(slotConfig);
        if (!normalized) return;

        const validKeys = normalized.idle.filter(k => this.scene.textures.exists(k));
        if (validKeys.length === 0) return;

        const slotImg = this.scene.add.image(x, y, validKeys[0]).setOrigin(0.5, 0.5);
        const scale = Math.min(maxW / slotImg.width, maxH / slotImg.height, 1);
        slotImg.setScale(scale);
        this.contentLayer.add(slotImg);

        if (validKeys.length > 1) {
            let frameIndex = 0;
            const timer = this.scene.time.addEvent({
                delay: normalized.frameRate,
                loop: true,
                callback: () => {
                    frameIndex = (frameIndex + 1) % validKeys.length;
                    slotImg.setTexture(validKeys[frameIndex]);
                    const s = Math.min(maxW / slotImg.width, maxH / slotImg.height, 1);
                    slotImg.setScale(s);
                }
            });
            this.slotTimers.push(timer);
        }
    }

    _createLinkButton(x, y, label, url, maxW) {
        const btnW = Math.min(280, maxW);
        const btn = this.scene.add.rectangle(x, y + 15, btnW, 38, 0x6c63ff)
            .setInteractive({ useHandCursor: true });
        const txt = this.scene.add.text(x, y + 15, `🔗 ${label}`, {
            fontFamily: 'Nunito, sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.on('pointerover', () => btn.setFillStyle(0x8b83ff));
        btn.on('pointerout', () => btn.setFillStyle(0x6c63ff));
        btn.on('pointerdown', () => {
            if (url) window.open(url, '_blank');
            this.hide();
        });

        this.contentLayer.add([btn, txt]);
        return { btn, txt };
    }

    _createVideoOverlay(videoUrl, cx, cy, maxW, maxH) {
        const canvas = this.scene.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        const { width: gameW, height: gameH } = this.scene.scale;

        const scaleX = canvasRect.width / gameW;
        const scaleY = canvasRect.height / gameH;

        const vidW = Math.min(maxW, 400) * scaleX;
        const vidH = maxH * scaleY;
        const vidX = canvasRect.left + (cx * scaleX) - vidW / 2;
        const vidY = canvasRect.top + (cy * scaleY);

        const video = document.createElement('video');
        video.src = videoUrl;
        video.controls = true;
        video.autoplay = false;
        video.style.cssText = `
            position: fixed;
            left: ${vidX}px;
            top: ${vidY}px;
            width: ${vidW}px;
            height: ${vidH}px;
            z-index: 10000;
            border-radius: 8px;
            background: #000;
        `;
        document.body.appendChild(video);
        this.videoEl = video;
    }
}

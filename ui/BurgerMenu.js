import Phaser from 'phaser';

export default class BurgerMenu extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {Array} menuItems - Array of { label, color, callback }
     */
    constructor(scene, x, y, menuItems) {
        super(scene, x, y);
        this.scene = scene;
        this.menuItems = menuItems || [];

        // --- 1. The Burger Button ---
        this.createBurgerIcon();
        this.setScale(1.5); // Global Scale 150%

        // --- 2. The Menu Overlay (Hidden initially) ---
        this.createOverlay();

        // Add to scene
        scene.add.existing(this);
    }

    createBurgerIcon() {
        // Background Hit Area
        const hitArea = this.scene.add.rectangle(0, 0, 50, 50, 0x444444, 0.8)
            .setInteractive({ useHandCursor: true });

        // Icon Text (Shifted 3px lower)
        const icon = this.scene.add.text(0, 3, '☰', { fontSize: '40px', color: '#ffffff' }).setOrigin(0.5);

        this.add([hitArea, icon]);

        hitArea.on('pointerdown', () => this.toggleMenu());
    }

    createOverlay() {
        const { width, height } = this.scene.scale;

        // The Overlay Container (Full Screen relative to 0,0 of Camera)
        // We attach this to the Scene, NOT 'this' container, because 'this' might move.
        // Actually, let's keep it managed by this class but add it to scene root z-index high.
        this.overlay = this.scene.add.container(width / 2, height / 2).setDepth(20000).setVisible(false);

        // Blocker
        const blocker = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.85)
            .setInteractive() // Block clicks
            .on('pointerdown', () => this.toggleMenu());

        this.overlay.add(blocker);

        // Panel
        const panelW = 340;
        const totalH = 120 + (this.menuItems.length * 70); // Dynamic Height (Increased base)
        const panel = this.scene.add.rectangle(0, 0, panelW, totalH, 0x222222).setStrokeStyle(2, 0x555555);
        this.overlay.add(panel);

        // Title
        const title = this.scene.add.text(0, -totalH / 2 + 40, 'MENU', {
            fontSize: '32px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);
        this.overlay.add(title);

        // Generate Buttons
        let startY = -totalH / 2 + 100;

        this.menuItems.forEach((item, index) => {
            const y = startY + (index * 70);
            this.createMenuButton(0, y, item);
        });
    }

    createMenuButton(x, y, item) {
        const btn = this.scene.add.rectangle(x, y, 280, 55, item.color || 0x555555)
            .setInteractive({ useHandCursor: true });

        const txt = this.scene.add.text(x, y, item.label, {
            fontSize: '20px', fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerdown', () => {
            // Visual Feedback
            this.scene.tweens.add({
                targets: [btn, txt],
                scale: 0.95,
                yoyo: true,
                duration: 50,
                onComplete: () => {
                    if (item.callback) item.callback();
                    if (item.closeOnClick !== false) this.toggleMenu();
                }
            });
        });

        this.overlay.add([btn, txt]);
    }

    toggleMenu() {
        this.overlay.setVisible(!this.overlay.visible);
    }

    destroy() {
        if (this.overlay) this.overlay.destroy();
        super.destroy();
    }
}

export default class DevPositioner {
    /**
     * @param {Phaser.Scene} scene
     * @param {Phaser.GameObjects.Image} bg - The background image reference for scaling context
     */
    constructor(scene, bg) {
        this.scene = scene;
        this.bg = bg;
        this.labels = new Map();

        // Listen for drag events
        this.scene.input.on('drag', this.onDrag, this);
        this.scene.input.on('dragend', this.onDragEnd, this);

        console.log('%c DevPositioner Enabled ', 'background: #222; color: #bada55');
    }

    enable(target) {
        if (!target) return;

        // Ensure interactive
        if (!target.input) {
            target.setInteractive({ draggable: true, useHandCursor: true });
        } else {
            // Already interactive, just enable drag and cursor
            this.scene.input.setDraggable(target, true);
            target.input.cursor = 'pointer';
        }

        // Create debug label
        const label = this.scene.add.text(target.x, target.y, '', {
            fontFamily: 'monospace',
            fontSize: '16px',
            backgroundColor: '#000000aa',
            color: '#ffffff',
            padding: { x: 5, y: 5 }
        }).setDepth(1000).setOrigin(0.5, 0); // Below the feet

        this.labels.set(target, label);
        this.updateLabel(target);
    }

    onDrag(pointer, gameObject, dragX, dragY) {
        // Move object
        gameObject.x = dragX;
        gameObject.y = dragY;

        // Update label
        this.updateLabel(gameObject);
    }

    onDragEnd(pointer, gameObject) {
        const { x, y } = this.calculateSourceCoordinates(gameObject);
        const textureKey = gameObject.texture ? gameObject.texture.key : 'Shape';

        const logMsg = `addChar('${textureKey}', ${Math.round(x)}, ${Math.round(y)});`;
        console.log(`%c ${logMsg} `, 'background: #004400; color: #ffffff; font-size: 14px');

        // Flash label green to indicate save
        const label = this.labels.get(gameObject);
        if (label) {
            label.setStyle({ color: '#00ff00' });
            this.scene.time.delayedCall(500, () => label.setStyle({ color: '#ffffff' }));
        }
    }

    updateLabel(gameObject) {
        const label = this.labels.get(gameObject);
        if (!label) return;

        // Follow object
        label.x = gameObject.x;
        label.y = gameObject.y + 10; // Slightly below

        const { x, y } = this.calculateSourceCoordinates(gameObject);
        label.setText(`X: ${Math.round(x)}\nY: ${Math.round(y)}`);
    }

    calculateSourceCoordinates(gameObject) {
        // Reverse engineer the positioning logic from MainMenuScene
        // Logic: screenY = bgStartY + ((y + feetOffset) * bgScale);

        const bgScale = this.bg.scaleX; // Assuming uniform scale

        // Calculate BG top-left in screen space
        // bg.x is center-x, bg.y is bottom-y (origin 0.5, 1)
        const expBgW = this.bg.width * bgScale;
        const expBgH = this.bg.height * bgScale;
        const bgStartX = this.bg.x - (expBgW / 2); // bg.x is width/2
        const bgStartY = this.bg.y - expBgH;       // bg.y is height

        // Screen to Relative 'Feet' Position
        const relativeFeetX = (gameObject.x - bgStartX) / bgScale;
        const relativeFeetY = (gameObject.y - bgStartY) / bgScale;

        // Adjust for Feet Offset to get Center
        const feetOffset = gameObject.height / 2; // Source height / 2

        const centerX = relativeFeetX;
        const centerY = relativeFeetY - feetOffset;

        return { x: centerX, y: centerY };
    }
}

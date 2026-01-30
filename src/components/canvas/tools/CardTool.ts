import { StateNode, TLEventInfo } from 'tldraw';
import { useCardStore } from '@/stores';
import { SHAPE_DEFAULTS, COLORS } from '@/lib/constants';
import { createLogger } from '@/lib/logger';

const log = createLogger('CardTool');

export class CardTool extends StateNode {
    static override id = 'card';

    override onEnter = () => {
        this.editor.setCursor({ type: 'cross', rotation: 0 });
        log.debug('Entered Card Tool');
    };

    override onExit = () => {
        this.editor.setCursor({ type: 'default', rotation: 0 });
        log.debug('Exited Card Tool');
    };

    override onPointerDown = (info: TLEventInfo) => {
        if (info.name === 'pointer_down' && info.button === 0) {
            const { x, y } = this.editor.inputs.currentPagePoint;

            // Create card data in store
            const card = useCardStore.getState().createCard('', 'New Card', COLORS.DEFAULT_CARD);

            // Create shape in editor
            this.editor.createShape({
                type: 'card',
                x: x - SHAPE_DEFAULTS.CARD.WIDTH / 2,
                y: y - SHAPE_DEFAULTS.CARD.HEIGHT / 2,
                props: {
                    w: SHAPE_DEFAULTS.CARD.WIDTH,
                    h: SHAPE_DEFAULTS.CARD.HEIGHT,
                    cardId: card.id,
                    title: card.title || 'New Card',
                    content: card.content || '',
                    color: card.color || COLORS.DEFAULT_CARD,
                    isEditing: false,
                },
            });

            log.debug('Created card at', x, y);

            // Switch back to select tool after placement
            // We do this in a timeout to allow the pointer up event to fire cleanly
            // or simply switch immediately if we want single-click-place behavior
            this.editor.setCurrentTool('select');
        }
    };

    override onCancel = () => {
        this.editor.setCurrentTool('select');
    };
}

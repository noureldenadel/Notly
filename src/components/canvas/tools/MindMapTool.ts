import { StateNode, TLEventInfo } from 'tldraw';
import { SHAPE_DEFAULTS } from '@/lib/constants';
import { createDefaultMindMap } from '../shapes/MindMapShape';
import { createLogger } from '@/lib/logger';

const log = createLogger('MindMapTool');

export class MindMapTool extends StateNode {
    static override id = 'mindmap';

    override onEnter = () => {
        this.editor.setCursor({ type: 'cross', rotation: 0 });
        log.debug('Entered MindMap Tool');
    };

    override onExit = () => {
        this.editor.setCursor({ type: 'default', rotation: 0 });
        log.debug('Exited MindMap Tool');
    };

    override onPointerDown = (info: TLEventInfo) => {
        if (info.name === 'pointer_down' && info.button === 0) {
            const { x, y } = this.editor.inputs.currentPagePoint;

            this.editor.createShape({
                type: 'mindmap',
                x: x - SHAPE_DEFAULTS.MINDMAP.WIDTH / 2,
                y: y - SHAPE_DEFAULTS.MINDMAP.HEIGHT / 2,
                props: {
                    w: SHAPE_DEFAULTS.MINDMAP.WIDTH,
                    h: SHAPE_DEFAULTS.MINDMAP.HEIGHT,
                    rootNode: createDefaultMindMap('Main Topic'),
                    layout: 'horizontal',
                    theme: 'default',
                },
            });

            log.debug('Created mindmap at', x, y);

            this.editor.setCurrentTool('select');
        }
    };

    override onCancel = () => {
        this.editor.setCurrentTool('select');
    };
}

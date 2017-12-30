const DraftJs = require('draft-js');
const Immutable = require('immutable');

const { List, Repeat, Map } = Immutable;
const {
  EditorState,
  ContentBlock,
  ContentState,
  genKey,
} = DraftJs;

module.exports = {
  BlockLevelRegex: [
    {
      blockType: 'code',
      regex: /```[a-z]/,
      modifierType: 'change-block-type',
      customFunction: (matchResult, editorState, index, markdownArray) => {
        const language = matchResult.input.replace('```', '').trim();
        const blockType = `custom-code-block${language ? '-' + language : ''}`;

        let newContentState = editorState.getCurrentContent();
        let newIndex = index;

        for (let i = index + 1; i < markdownArray.length; i++) {
          if (markdownArray[i].includes('```')) {
            newIndex = i;
            break;
          }

          const text = markdownArray[i];

          let newBlock = new ContentBlock({
            key: genKey(),
            type: blockType,
            text: text,
            characterList: List(
              Repeat(DraftJs.CharacterMetadata.create(), text.length)
            )
          });

          let newBlockMap = newContentState
            .getBlockMap()
            .set(newBlock.key, newBlock);

          newContentState = ContentState.createFromBlockArray(
            newBlockMap.toArray()
          );
        }

        return {
          newEditorState: EditorState.push(editorState, newContentState),
          newIndex
        };
      }
    },
    {
      blockType: 'image',
      regex: /(!\[)(.*?)(\])\(.*?\)/,
      modifierType: 'apply-entity',
      customFunction: (matchResult, editorState) => {
        const text = matchResult[2];

        let url = /(?:__|[*#])|\(.*?\)/
          .exec(matchResult[0])[0]
          .replace('(', '')
          .replace(')', '');

        const contentState = editorState.getCurrentContent();
        const contentStateWithEntity = contentState.createEntity(
          'image',
          'IMMUTABLE',
          { src: url }
        );
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

        const lastBlock = contentStateWithEntity.getLastBlock()

        const newSelection = new DraftJs.SelectionState({
          anchorKey: lastBlock.getKey(),
          anchorOffset: lastBlock.getLength(),
          focusKey: lastBlock.getKey(),
          focusOffset: lastBlock.getLength(),
        });

        const updateSelectionEditorState = DraftJs.EditorState.forceSelection(editorState, newSelection)

        const newEditorState = DraftJs.AtomicBlockUtils.insertAtomicBlock(
          updateSelectionEditorState,
          entityKey,
          ' '
        );

        return {
          newEditorState
        };
      }
    },
    {
      blockType: 'header-four',
      regex: /^(#### )(.*(\n|\r|$))/
    },
    {
      blockType: 'header-three',
      regex: /^(### )(.*(\n|\r|$))/
    },
    {
      blockType: 'header-two',
      regex: /^(## )(.*(\n|\r|$))/
    },
    {
      blockType: 'header-one',
      regex: /^(# )(.*(\n|\r|$))/
    },
    {
      blockType: 'blockquote',
      regex: /^(> ) (.*(\n|\r|$))/
    },
    {
      //TODO: modify to have x or space
      blockType: 'todo',
      regex: /^(- \[.*?\])(.*(\n|\r|$))/,
      customFunction: (matchResult, editorState) => {
        const checked = matchResult[1] && matchResult[1] === '- [x]';
        const text = matchResult[2];

        let newContentState = editorState.getCurrentContent();

        let newBlock = new ContentBlock({
          key: genKey(),
          type: 'todo',
          text: text,
          characterList: List(
            Repeat(DraftJs.CharacterMetadata.create(), text.length)
          ),
          data: Map({
            checked
          })
        });

        let newBlockMap = newContentState
          .getBlockMap()
          .set(newBlock.key, newBlock);
        newContentState = ContentState.createFromBlockArray(
          newBlockMap.toArray()
        );

        return {
          newEditorState: EditorState.push(editorState, newContentState)
        };
      }
    },
    {
      blockType: 'ordered-list-item',
      regex: /^(\s*\d+\.)\s+(.*(\n|\r|$))/
    },
    {
      blockType: 'unordered-list-item',
      regex: /^(\s*-|\*)\s+(.*(\n|\r|$))/
    }
  ],
  InlineRegex: [
    {
      inlineStyle: 'BOLD',
      regex: /(\*\*)(.*?)\*\*/
    },
    {
      inlineStyle: 'ITALIC',
      regex: /(\*)(.*?)\*/
    },
    {
      inlineStyle: 'INLINECODE',
      regex: /(`)(.*?)`/
    }
  ],
  EntitiesRegex: [
    {
      entity: 'LINK',
      regex: /(\[)(.*?)(\])\(.*?\)/gm
    }
  ]
};

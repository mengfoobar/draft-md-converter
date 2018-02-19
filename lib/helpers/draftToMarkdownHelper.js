const DraftJs = require('draft-js');
const {getBlockEntity} = require('./utils')

const InlineMarkdownChars = {
  ITALIC: '*',
  INLINECODE: '`',
  BOLD: '**'
};

const BlockMarkdownChars = {
  'divider': '---',
  'header-one': '# ',
  'header-two': '## ',
  'header-three': '### ',
  'header-four': '#### ',
  blockquote: '> ',
  'unordered-list-item': '- ',
  'ordered-list-item': '1. ',
  'todo-unchecked': '- [ ] ',
  'todo-checked': '- [x] ',
  'custom-code-block': '',
  unstyled: ''
};

module.exports = {
  processBlockLevel: (block, blocks, index, markdownLine, editorState) => {
    //TODO: assume every block is multi lines
    let result = {
      str: '',
      newIndex: index
    };

    if (block.type === 'todo') {
      block.type = block.data.checked ? 'todo-checked' : 'todo-unchecked';
    }

    if (block.type.includes('custom-code-block')) {
      result = draftToMDCodeBlocks(blocks, index);
    } else if (block.type === 'atomic') {
      const entity = getEntityData(editorState, block.key, 0)
      if(!entity){
        return
      }
      switch(entity.getType()){
        case 'image':
          result.str = `![Image](${entity.getData().src})`;
          break;
        default:
          return
      }

    } else {
      result.str =
        '  '.repeat(block.depth) +
        BlockMarkdownChars[block.type] +
        markdownLine;
    }

    return result;
  },
  processInlineStyles: (block, charsToInject) => {
    for (let index in block.inlineStyleRanges) {
      let inlineStyle = block.inlineStyleRanges[index];

      let openingPosition = inlineStyle.offset || 0;
      !charsToInject[openingPosition] && (charsToInject[openingPosition] = '');

      if (block)
        charsToInject[openingPosition] =
          InlineMarkdownChars[inlineStyle.style] +charsToInject[openingPosition];

      let closingPosition = openingPosition + inlineStyle.length;
      !charsToInject[closingPosition] && (charsToInject[closingPosition] = '');

      charsToInject[closingPosition] += InlineMarkdownChars[inlineStyle.style];
    }
  },
  processEntityRanges: (block, editorState, charsToInject) => {
    for (let index in block.entityRanges) {
      let entityStyle = block.entityRanges[index];

      let openingPosition = entityStyle.offset || 0;
      !charsToInject[openingPosition] && (charsToInject[openingPosition] = '');
      let closingPosition = openingPosition + entityStyle.length;
      !charsToInject[closingPosition] && (charsToInject[closingPosition] = '');

      const entity = getEntityData(editorState, block.key, entityStyle.offset);

      switch (entity.getType()) {
        case 'LINK':
          charsToInject[openingPosition] = '[' + charsToInject[openingPosition];

          if (!charsToInject[closingPosition]) {
            charsToInject[closingPosition] = `](${entity.getData()})`;
          } else {
            charsToInject[closingPosition] =
              charsToInject[closingPosition] + `](${entity.getData()})`;
          }
          break;
        default:
          break;
      }
    }
  },
  injectMarkDownCharsToText: (index, src, str, rm) => {
    rm = rm || 0;
    src = src || '';
    return src.slice(0, index) + str + src.slice(index + rm);
  }
};


const getEntityData = (editorState, blockKey, offset) => {
  let contentState = editorState.getCurrentContent();

  const blockWithLinkAtBeginning = contentState.getBlockForKey(blockKey);
  const key = blockWithLinkAtBeginning.getEntityAt(offset);

  return contentState.getEntity(key);
};

const draftToMDCodeBlocks = (blocks, index) => {
  let result = {};
  let blockType = blocks[index].type;
  let blockTypeSplitted = blockType.split('-');
  let lang = blockType.split('-').length === 4 ? blockTypeSplitted[3] : '';

  var str = '```' + lang;

  for (var i = index; i < blocks.length; i++) {
    if (blocks[i].type !== blockType) {
      break;
    } else {
      str += '\n' + blocks[i].text;
    }
  }

  str += '\n```';
  result.newIndex = i - 1;
  result.str = str;
  return result;
};

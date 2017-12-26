const DraftJs = require('draft-js');
const EditorState = DraftJs.EditorState;

const DraftToMarkdownHelper = require('./helpers/draftToMarkdownHelper');
const MarkdownToDraftHelper = require('./helpers/markdownToDraftHelper');

module.exports = {
  MDToDraft(markdownStr) {
    let editorState = EditorState.createEmpty();
    const markdownStrArray = markdownStr.split('\n');

    for (let i = 0; i < markdownStrArray.length; i++) {
      const result = MarkdownToDraftHelper.processLineLevel(
        editorState,
        i,
        markdownStrArray
      );

      i = result.newIndex;
      editorState = result.newEditorState;
    }

    //removing first empty line
    const blockMap = editorState.getCurrentContent().getBlockMap();
    const newBlockMap = blockMap.remove(
      editorState.getCurrentContent().getFirstBlock().getKey()
    );
    const newContentState = editorState.getCurrentContent().merge({
      blockMap: newBlockMap
    });

    return DraftJs.convertToRaw(newContentState);
  },

  draftToMD(rawNote, editorState) {
    let markdownBody = '';
    let blocks = rawNote.blocks;

    for (let i = 0; i < blocks.length; i++) {
      let injectedChars = {};
      let offset = 0;
      let markdownStrPart = blocks[i].text;

      DraftToMarkdownHelper.processInlineStyles(blocks[i], injectedChars);

      if(blocks[i].type!=='atomic'){
        DraftToMarkdownHelper.processEntityRanges(
          blocks[i],
          editorState,
          injectedChars
        );
      }

      for (let key in injectedChars) {
        key = parseInt(key, 10);
        markdownStrPart = DraftToMarkdownHelper.injectMarkDownCharsToText(
          key + offset,
          markdownStrPart,
          injectedChars[key]
        );
        offset += injectedChars[key].length;
      }

      const processBlockLevelResult = DraftToMarkdownHelper.processBlockLevel(
        blocks[i],
        blocks,
        i,
        markdownStrPart,
        editorState
      );

      markdownStrPart = processBlockLevelResult.str;
      markdownBody += `${markdownStrPart}${i === blocks.length - 1
        ? ''
        : '\n'}`;

      i = processBlockLevelResult.newIndex;
    }

    return markdownBody;
  }
};

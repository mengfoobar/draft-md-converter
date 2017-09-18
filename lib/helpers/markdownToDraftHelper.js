const { List, Repeat } = require('immutable');

const {
  EditorState,
  ContentState,
  ContentBlock,
  Modifier,
  genKey,
  CharacterMetadata
} = require('draft-js');

const DraftEntityHelper = require('./draftEntityHelper');
const Utils = require('./utils');
const Regexes = require('../constants/regexes');

module.exports = {
  processLineLevel: (editorState, index, markdownArray) => {
    const currentLine = markdownArray[index];
    let newEditorState = null;
    let newIndex = index;

    for (let i = 0; i < Regexes.BlockLevelRegex.length; i++) {
      const { regex, blockType, customFunction } = Regexes.BlockLevelRegex[i];
      const matchResult = regex.exec(currentLine);

      if (matchResult) {
        let result = customFunction
          ? customFunction(matchResult, editorState, index, markdownArray)
          : appendBlock(
              editorState,
              blockType,
              matchResult[2],
              Math.floor(currentLine.search(/\S/) / 2)
            );

        newEditorState = result.newEditorState;
        newIndex = result.newIndex || newIndex;

        break;
      }
    }

    !newEditorState &&
      (newEditorState = appendBlock(editorState, 'unstyled', currentLine)
        .newEditorState);

    //order matters as of now
    newEditorState = processInLineEntites(newEditorState);
    newEditorState = processInLineStyles(newEditorState);

    return {
      newIndex,
      newEditorState
    };
  }
};

const processInLineEntites = editorState => {
  let contentState = editorState.getCurrentContent();
  let contentBlock = contentState.getLastBlock();
  let newEditorState = editorState;

  for (let i = 0; i < Regexes.EntitiesRegex.length; i++) {
    const { regex, entity } = Regexes.EntitiesRegex[i];

    let matchResult;
    while ((matchResult = regex.exec(contentBlock.getText())) !== null) {
      switch (entity) {
        case 'LINK':
          contentState = DraftEntityHelper.processLink(
            contentState,
            contentBlock,
            matchResult,
            regex
          );
          break;
        default:
          break;
      }

      contentBlock = contentState.getBlockForKey(contentBlock.getKey());
      newEditorState = EditorState.push(
        editorState,
        contentState,
        'apply-entity'
      );
    }
  }

  return newEditorState;
};

const processInLineStyles = editorState => {
  let contentState = editorState.getCurrentContent();
  let contentBlock = contentState.getLastBlock();

  const contentBlockKey = contentBlock.getKey();

  for (let i = 0; i < Regexes.InlineRegex.length; i++) {
    const { regex, inlineStyle } = Regexes.InlineRegex[i];

    // const lineText = contentBlock.getText();
    let matchResult;

    while ((matchResult = regex.exec(contentBlock.getText())) !== null) {
      let selectionState = Utils.getSelectionState(
        matchResult,
        contentBlockKey
      );

      contentState = Modifier.applyInlineStyle(
        contentState,
        selectionState,
        inlineStyle
      );
      const matchedStrWORegex = matchResult[0].replace(regex, '$2');
      /*
        TODO:
        We are reapplying any existing entity within selected range.
        However, it only takes the first entity found;
        improve later on should we have multiple entities
       */
      const entityWithinSelection = getEntityInSelection(
        selectionState,
        contentBlock
      );

      contentState = Modifier.replaceText(
        contentState,
        selectionState,
        matchedStrWORegex,
        contentState
          .getBlockForKey(contentBlockKey)
          .getInlineStyleAt(matchResult.index),
        entityWithinSelection
      );

      //update contentBlock with applied modifications
      contentBlock = contentState.getBlockForKey(contentBlockKey);

      editorState = EditorState.push(
        editorState,
        contentState,
        'change-inline-style'
      );
    }
  }

  return editorState;
};

const appendBlock = (editorState, type, text, depth) => {
  let newBlock = new ContentBlock({
    key: genKey(),
    type: type,
    text: text,
    characterList: List(Repeat(CharacterMetadata.create(), text.length)),
    depth: depth
  });

  let newContentState = editorState.getCurrentContent();
  let newBlockMap = newContentState.getBlockMap().set(newBlock.key, newBlock);

  return {
    newEditorState: EditorState.push(
      editorState,
      ContentState.createFromBlockArray(newBlockMap.toArray())
    )
  };
};

const getEntityInSelection = (selectionState, block) => {
  let entity = null;
  let start = selectionState.getStartOffset();
  let end = selectionState.getEndOffset();

  for (let i = start; i < end; i++) {
    if (block.getEntityAt(i)) {
      entity = block.getEntityAt(i);
      break;
    }
  }
  return entity;
};

const DraftJs = require('draft-js');
const Modifier = DraftJs.Modifier;
const Entity = DraftJs.Entity;

const Utils = require('./utils');

module.exports = {
  processLink: (contentState, contentBlock, matchResult, regex) => {
    const matchedStr = matchResult[0];

    let url = /(?:__|[*#])|\(.*?\)/gm
      .exec(matchedStr)[0]
      .replace('(', '')
      .replace(')', '');
    let linkText = /(?:__|[*#])|\[(.*?)\]/gm
      .exec(matchedStr)[0]
      .replace('[', '')
      .replace(']', '');

    let entityKey = getLinkEntity(url);
    let selectionState = Utils.getSelectionState(
      matchResult,
      contentBlock.getKey()
    );

    contentState = Modifier.applyEntity(
      contentState,
      selectionState,
      entityKey
    );
    contentState = Modifier.replaceText(
      contentState,
      selectionState,
      matchedStr.replace(regex, linkText),
      null,
      entityKey
    );
    return contentState;
  }
};

const getLinkEntity = url => {
  let newUrl = url;

  if (url !== '') {
    if (url.indexOf('@') >= 0) {
      newUrl = `mailto:${newUrl}`;
    } else if (url.indexOf('http') === -1) {
      newUrl = `http://${newUrl}`;
    }
    return Entity.create('LINK', 'MUTABLE', newUrl);
  } else {
    return null;
  }
};

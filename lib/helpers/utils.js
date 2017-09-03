const DraftJs = require('draft-js');
const SelectionState = DraftJs.SelectionState;

module.exports={
  getSelectionState:(matchResult, contentBlockKey)=>{
    let start = matchResult.index;
    let end = matchResult[0].length + start;

    return SelectionState.createEmpty(contentBlockKey).merge({
      anchorOffset: start,
      focusOffset: end
    });


  }
}
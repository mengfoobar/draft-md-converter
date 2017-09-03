const express = require('express');
const router = express.Router();
const DraftJs = require('draft-js')

const DraftToMD = require('../lib/index.js')

router.post('/drafttomd', function (req, res, next) {
  let note = req.body.note.body
  const contentState = DraftJs.convertFromRaw(note);
  const editorState = DraftJs.EditorState.createWithContent(
    contentState
  );

  const mdString = DraftToMD.draftToMD(note, editorState)
  res.send(mdString);
})

router.post('/mdtodraft', function (req, res, next) {
  let markdown = req.body.markdown

  const rawNote = DraftToMD.MDToDraft(markdown)
  res.json(rawNote);
})


module.exports = router;
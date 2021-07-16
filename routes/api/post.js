const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator/check');
const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

//@route   POST api/post
//@desc    Create a Post
//@access  Private
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = newPost;
      await newPost.save();
      res.json(post);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  }
);

//@route   GET api/post
//@desc    Get all Posts
//@access  Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
});

//@route   GET api/post/:id
//@desc    Get Post by id
//@access  Private
router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Internal Server Error');
  }
});

//@route   delete api/post/:id
//@desc    delete Post by id
//@access  Private
router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    //Check on the user
    if (!post) {
      res.status(404).json({ msg: 'Post not found' });
    }
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not Authorised' });
    }

    await post.remove();
    res.json({ msg: 'Post Removed' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Internal Server Error');
  }
});

//@route   put api/post/:id
//@desc    like a post by id
//@access  Private
router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      res.status(404).json({ msg: 'Post not found' });
    }
    //check is post was already liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    return res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
});

//@route   put api/post/:id
//@desc    unlike a post by id
//@access  Private
router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    //check is post was already liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post was not liked' });
    }
    // Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    return res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
});

//@route   post api/post/comment/:id
//@desc    write a comment
//@access  Private
router.post(
  '/comment/:post_id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.post_id);
      if (!post) {
        res.status(404).json({ msg: 'Post not found' });
      }
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);
      await post.save();
      res.json(post.comments);
    } catch (error) {
      if (error.kind === 'ObjectId')
        res.status(404).json({ msg: 'Post not found' });
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  }
);

//@route  delete api/post/comment/:post_id/:comment_id
//@desc    delete a comment
//@access  Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      res.status(404).json({ msg: 'Post not found' });
    }

    //pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // comment exists
    if (!comment)
      return res.status(404).json({ msg: 'Comment does not exist' });

    //Make sure user is same as deleting one
    if (comment.user.toString() !== req.user.id)
      return res.status(401).json({ msg: 'User not Authorised' });
    //get remove index
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    return res.json(post.comments);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;

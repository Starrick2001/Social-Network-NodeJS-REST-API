const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");

//firebase
const firebase = require("../firebase");
const multer = require("multer");

//create post
router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});
//update post
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json("Post has been updated");
    } else {
      res.status(403).json("You can only update your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
//delete post
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json("Post has been deleted");
    } else {
      res.status(403).json("You can only delete your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
//get post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    !post && res.status(404).json("Post not found");
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});
//like post
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("Post has been liked");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("Post has been unliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});
//get timeline posts
router.get("/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    const userPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    res.status(200).json(userPosts.concat(...friendPosts));
  } catch (err) {
    res.status(500).json(err);
  }
});

//get user's all posts
router.get("/profile/:username", async (req, res) => {
  try {
    const currentUser = await User.findOne({ username: req.params.username });
    const userPosts = await Post.find({ userId: currentUser._id });
    res.status(200).json(userPosts);
  } catch (err) {
    res.status(500).json(err);
  }
});

//upload image to firebase storage
const upload = multer({
  storage: multer.memoryStorage(),
});
router.post("/:id/uploadImg", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("Error: No files found");
  }
  const blob = firebase.bucket.file(
    "posts/" + req.params.id + "/" + req.body.name
  );

  const blobWriter = await blob.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobWriter.on("error", (err) => {
    console.log(err);
  });

  blobWriter.on("finish", () => {
    return res.status(200).json("File uploaded.");
  });

  blobWriter.end(req.file.buffer);
});

module.exports = router;

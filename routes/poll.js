const express = require("express");

const Poll = require("../models/poll");
const User = require("../models/user");

const auth = require("../middleware/auth");

const router = new express.Router();

router.get("/showPolls", async (req, res) => {
  try {
    const polls = await Poll.find();

    res.status(200).json({ polls });
  } catch (e) {
    res.status(400).json({ message: "Sorry bad request" });
  }
});

router.post("/createPoll", auth, async (req, res) => {
  try {
    const { id } = req.decoded;

    const user = await User.findById(id);

    const { question, options } = req.body;

    const poll = await Poll.create({
      question,
      user,
      options: options.map((option) => ({ option, votes: 0 })),
    });

    user.polls.push(poll._id);

    await user.save();

    res.status(201).json({ ...poll._doc, user });
  } catch (e) {
    res.status(400).json({ message: "Sorry that seems like a bad request" });
  }
});

router.get("/userPolls", auth, async (req, res) => {
  try {
    const { id } = req.decoded;

    const user = await User.findById(id).populate("polls");

    res.status(200).json(user.polls);
  } catch (e) {
    res.status(400).json({ message: "Sorry bad req" + e });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const polls = await Poll.findById(id).populate("user", ["username", "id"]);

    res.status(200).json(polls);
  } catch (e) {
    res.status(400).json({ message: "Sorry bad request" + e });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.decoded;

    const poll = await Poll.findById(id);
    if (!poll) {
      throw new Error("No poll found");
    }
    if (poll.user.toString() !== userId) {
      throw new Error("Unauthorized, request denied!");
    }

    await poll.remove();

    res.status(202).json(poll);
  } catch (e) {
    res.status(400).json({ message: "Sorry bad request" + e });
  }
});

module.exports = router;

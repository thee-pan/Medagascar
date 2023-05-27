const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  docemail: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const allergySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  allergy: {
    type: String,
    required: true,
  },
});

const familyHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  disease: {
    type: String,
    required: true,
  },
});

const medicineSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  medicine: {
    type: String,
    required: true,
  },

  date: {
    type: String,
    required: true,
  },
});

const uploadSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  imageDetails: {
    type: String,
    required: true,
  },

  date: {
    type: String,
    required: true,
  },
});

const RegisterUser = mongoose.model("RegisterUser", userSchema);
const Allergy = mongoose.model("Allergy", allergySchema);
const FamilyHistory = mongoose.model("FamilyHistory", familyHistorySchema);
const Upload = mongoose.model("Upload", uploadSchema);
const Medicine = mongoose.model("Medicine", medicineSchema);

module.exports = {
  RegisterUser,
  Allergy,
  FamilyHistory,
  Upload,
  Medicine,
};

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const cookieParser = require("cookie-parser");
var session = require("express-session");
var morgan = require("morgan");
var multer = require("multer");
var path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const {
  RegisterUser,
  Allergy,
  FamilyHistory,
  Upload,
  Medicine,
} = require("./model/db");

var imageDataFind = Upload.find({});

var imgData = "";
const app = express();
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/upload"));
app.use("/upload", express.static("upload"));

mongoose
  .connect("mongodb://localhost:27017/userReg")
  .then(() => {
    console.log("Database Connection Done");
  })
  .catch(() => {
    console.log("Error in establishing Database");
  });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));

app.use(
  session({
    key: "user_sid",
    secret: "somerandomstuffs",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000,
    },
  })
);

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie("user_sid");
  }
  next();
});

var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect("/profile");
  } else {
    next();
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

//const upload_multer = multer({ storage: Storage });

// const imageData = Upload.find({});

app.get("/", sessionChecker, function (req, res) {
  res.redirect("/signup");
});

var id = {};
var idUser = "";
var idString = "";

app
  .route("/signin")
  .get(sessionChecker, (req, res) => {
    res.render("signin");
  })
  .post(async (req, res) => {
    try {
      const check = await RegisterUser.findOne({ email: req.body.email });
      if (check.password === req.body.password) {
        console.log("Password check completed");
        id = { userId: check._id };
        idUser = JSON.stringify(id);
        idString = idUser.substring(11, idUser.length - 2);
        console.log(idString);
        console.log(id);
        req.session.user = req.body;
        res.redirect("/profile");
      } else {
        res.send("Password is incorrect");
      }
    } catch (error) {
      console.log(error);
      res.send("Wrong Details");
    }
  });

app
  .route("/signup")
  .get(sessionChecker, (req, res) => {
    res.render("signup");
  })
  .post(async (req, res) => {
    const data = new RegisterUser(req.body);
    console.log(data);
    data.save((err, docs) => {
      if (err) {
        res.redirect("/signup");
      } else {
        res.redirect("/signin");
      }
    });
  });

app.route("/prescription").get(async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    const imgData = await Upload.find({ userId: idString }, null)
      .populate("imageDetails")
      .clone();

    res.render("prescriptions", {
      records: imgData,
    });
  } else {
    res.redirect("/signin");
  }
});

app.route("/upload").get((req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.render("upload");
  } else {
    res.redirect("/signin");
  }
});

app
  .route("/allergies")
  .get((req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      res.render("allergies");
    } else {
      res.redirect("/signin");
    }
  })
  .post(async (req, res) => {
    var allergyData = Object.assign(id, req.body);
    console.log(allergyData);
    const data = new Allergy(allergyData);
    console.log(data);
    await data.save();
    res.redirect("/profile");
  });

app
  .route("/familyHistory")
  .get((req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      res.render("familyHistory");
    } else {
      res.redirect("/signin");
    }
  })
  .post(async (req, res) => {
    console.log(id);
    var familyData = Object.assign(id, req.body);
    console.log(familyData);
    const data = new FamilyHistory(familyData);
    console.log(data);
    await data.save();
    res.redirect("/profile");
  });

app
  .route("/medicine")
  .get((req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      res.render("medicineUpload");
    } else {
      res.redirect("/signin");
    }
  })
  .post(async (req, res) => {
    console.log(id);
    var medicineName = { med: req.body.medicine };
    const jsonString = JSON.stringify(medicineName);
    fs.writeFile("./file.json", jsonString, (err) => {
      if (err) {
        console.log("Error writing file", err);
      } else {
        console.log("Successfully wrote file");
      }
    });

    fs.writeFileSync("./file.json", jsonString);

    var medicineData = Object.assign(id, req.body);
    console.log(medicineData);
    const data = new Medicine(medicineData);
    console.log(data);
    await data.save();

    res.redirect("/profile");
  });

app
  .route("/uploadFiles")
  .get((req, res) => {
    if (req.session.user && req.cookies.user_sid) {
      imageDataFind.exec(function (err, data) {
        if (err) throw err;
        res.render("imageUpload");
      });
    } else {
      res.redirect("/signin");
    }
  })
  .post(upload.single("file"), async (req, res) => {
    var imageDetailsUpload = Object.assign(
      id,
      {
        imageDetails: req.file.filename,
      },
      { date: req.body.date }
    );

    console.log("This is imagedetails 249", imageDetailsUpload);

    const data = new Upload(imageDetailsUpload);
    await data.save();

    console.log(data);
    if (req.session.user && req.cookies.user_sid) {
      Upload.find({ _id: idString }, (err, data) => {
        if (err) throw err;
        imgData = data;
        res.redirect("/prescription");
      });
    } else {
      res.redirect("/signin");
    }
  });

app.get("/profile", async (req, res) => {
  console.log(idString);
  idString = String(idString);
  if (req.session.user && req.cookies.user_sid) {
    const user = await RegisterUser.findOne({ _id: idString }, null).populate(
      "name"
    );

    const allergydb = await Allergy.find({ userId: idString }, null).populate(
      "allergy"
    );

    console.log(allergydb);
    const familydb = await FamilyHistory.find(
      { userId: idString },
      null
    ).populate("disease");
    const medicinedb = await Medicine.find({ userId: idString }, null).populate(
      "medicine"
    );

    res.render("profile", {
      user: user.name,
      age: user.dob,
      gender: user.gender,
      allergies: allergydb,
      family: familydb,
      medicines: medicinedb,
    });
  } else {
    console.log("Error in loading profile");
    res.redirect("/signin");
  }
});

app.get("/logout", (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie("user_sid");
    res.redirect("/");
  } else {
    res.redirect("/signin");
  }
});

app.get("/emergency", (req, res) => {
  res.redirect("/user/:" + idString);
  console.log(idString);
});

// app.get("/user/:id" + idString, async (req, res) => {
//   idString = String(idString);
//   if (req.session.user && req.cookies.user_sid) {
//     const user = await RegisterUser.findOne({ _id: idString }, null).populate(
//       "name"
//     );

//     const allergydb = await Allergy.find({ userId: idString }, null).populate(
//       "allergy"
//     );

//     const familydb = await FamilyHistory.find(
//       { userId: idString },
//       null
//     ).populate("disease");
//     const medicinedb = await Medicine.find({ userId: idString }, null).populate(
//       "medicine"
//     );

//     res.render("url", {
//       user: user.name,
//       age: user.dob,
//       gender: user.gender,
//       allergies: allergydb,
//       family: familydb,
//       medicines: medicinedb,
//     });
//   } else {
//     console.log("Error in loading profile");
//     res.redirect("/signin");
//   }
// });

app.get("/user/:id" + idString, async (req, res) => {
  idString = String(req.params.id.substring(1, req.params.id.length));
  console.log(idString);
  const user = await RegisterUser.findOne({ _id: idString }, null).populate(
    "name"
  );

  const allergydb = await Allergy.find({ userId: idString }, null).populate(
    "allergy"
  );

  const familydb = await FamilyHistory.find(
    { userId: idString },
    null
  ).populate("disease");
  const medicinedb = await Medicine.find({ userId: idString }, null).populate(
    "medicine"
  );

  res.render("url", {
    user: user.name,
    age: user.dob,
    gender: user.gender,
    allergies: allergydb,
    family: familydb,
    medicines: medicinedb,
  });
});

app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!");
});

app.listen(5000, function () {
  console.log("Server started on port 3000");
});

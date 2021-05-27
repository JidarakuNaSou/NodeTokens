const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
mongoose.connect("mongodb+srv://Admin-Yar:poker998cklub@cluster0.t2hym.mongodb.net/3drealtor?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));


const user = require("./routers/user");
app.use("/auth", user.auth);





if (process.env.NODE_ENV === "production") {

  app.get("/*", function root(req, res) {
    res.sendFile(path.resolve(__dirname + "/../build" + '/index.html'));
  });
}

app.listen(PORT, () => {
  return console.log("Server has been started...");
});

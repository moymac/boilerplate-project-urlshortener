require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const app = express();

let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let URLAddress;
let urlAddressSchema = new mongoose.Schema({
  original_url: String,
});
URLAddress = mongoose.model('urlAddress', urlAddressSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function (req, res) {
  const url = req.body.url;

  var regex = /^https?:\/\//; //need this format for res.redirect

  if (regex.test(url)) {
    var tempDnsUrl = url.slice(url.indexOf("//") + 2); //need to remove http(s):// to pass to dns.lookup
    var slashIndex = tempDnsUrl.indexOf("/"); //need to remove anythng past .com, etc., for dns.lookup
    var dnsUrl = slashIndex < 0 ? tempDnsUrl : tempDnsUrl.slice(0, slashIndex);
    console.log("slashIndex: " + slashIndex);


    dns.lookup(dnsUrl, (error, address) => {
      if (error) {
        res.json({ error: 'invalid URL' });
      } else {
        const newURL = new URLAddress({ original_url: url });
        newURL.save(function (err) {
          if (err) return console.error(err);
          res.send({ original_url: url, short_url: newURL._id });
        });
        // res.json({ original_url: url, short_url: id });
      }
    });
  } else {
    res.json({ error: 'invalid URL' });
  }
});

app.get('/api/shorturl/:id', function (req, res) {
  const id = req.params.id;
  console.log({ id });
  URLAddress.findById(id, function (err, data) {
    if (err) return console.error(err);
    if (data) {
      res.redirect(data.original_url);
    } else {
      res.json({ error: 'invalid URL' });
    }
  });

});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

  tabUrls = {}
  urlData = {}

  function getUrlData(tabId) {
      return urlData[tabId];
  }

  function getUrl(tabId) {
      return tabUrls[tabId];
  }

  function jreq(url, f, onError, depth) {
      var xhr = new XMLHttpRequest();
      try {
          /*xhr.onreadystatechange =*/
          function processData() {
              if (xhr.readyState === 4) {
                  var text = xhr.responseText;
                  if (text == "{error: 500}") {
                      if (depth >= 5) {
                          onError("error 500 for " + url + '. Gave up after ' + depth + ' tries.');
                          return;
                      }
                      return jreq(url, f, onError, depth ? (depth + 1) : 1);
                  }
                  var js = null;
                  try { // Needed because reddit returns raw html for strange urls (eg., : chrome://)
                      js = JSON.parse(text);
                  } catch (e) {
                      console.log("Expected JSON from:", url, "Instead got:", text);
                      onError("JSON.parse exception: " + e + "|" + text);
                  }
                  f(js);
              }
          };
          xhr.onerror = function(err) {
              console.log("xhr error:", err);
              onError("xhr error: " + e);
          };
          xhr.open("GET", url, true);
          xhr.onload = processData;
          xhr.send(null);
      } catch (e) {
          console.log("Exception:", e);
          onError("jreq exception: " + e);
      }
  }

  function stripUrlHash(url) {
      return url.split('#', 1)[0]
  }

  function getDomainName(url) {
      var l = document.createElement("a");
      l.href = url;
      var hostName = l.hostname;
      return hostName.substring(hostName.lastIndexOf(".", hostName.lastIndexOf(".") - 1) + 1);
  }

  function parse_youtube(url) {
      var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      var match = url.match(regExp);
      if (match && match[2].length == 11) {
          return match[2];
      } else {
          return null;
      }
  }

  function parse_imgur(url) {
      var regExp = RegExp("imgur\.com\/(?:gallery/|a/)?([a-zA-Z0-9]{5,7})(?:\.|$)", "i");
      var id = regExp.exec(url);
      if (id) {
          return id[1];
      } else {
          return null;
      }
  }

  function updateTabBadge(tab) {
      children = urlData[tab.id]

      l = children ? children.length : 0;
      chrome.browserAction.setBadgeBackgroundColor({
          color: [l ? 0 : 70, l ? 150 : 110, l ? 255 : 130, 255],
          tabId: tab.id
      });
      text = '' + l
      chrome.browserAction.setBadgeText({
          text: text,
          tabId: tab.id
      });
  }

  function tabChangedUrl(tab, old_url, new_url) {
      chrome.browserAction.setBadgeText({
          text: '...',
          tabId: tab.id
      });

      function onError(text) {
          console.error("Redditium|Error: " + text);
          chrome.browserAction.setBadgeText({
              text: 'ERR',
              tabId: tab.id
          });
      }
      var domain = getDomainName(new_url);
      var encoded_url = encodeURIComponent(new_url);
      var api_url = "https://www.reddit.com/api/info.json?url=" + encoded_url;

      /** custom handlers go here **/

      if (domain == 'youtube.com') {
          var video_id = parse_youtube(new_url);
          if (video_id) {
              api_url = 'https://www.reddit.com/search.json?q=url:"' + video_id + '"+url:youtube.com';
          }
      }

      if (domain == 'imgur.com') {
          var img_id = parse_imgur(new_url);
          if (img_id) {
              api_url = 'https://www.reddit.com/search.json?q=url:"' + img_id + '"+url:imgur.com';
          }
      }

      res = jreq(api_url + '&limit=100', processData, onError);

      function processData(js) {
          if (js.kind != 'Listing') {
              onError("Error, js kind is: " + js.kind);
              console.log("Error, js kind is: " + js.kind);
          }
          // filter out any false matches caused by reddit's search being case insensitive
          if (domain == 'imgur.com') {
              js.data.children = js.data.children.filter(function(el) {
                  var id = parse_imgur(el.data.url);
                  if (id) {
                      return id == img_id;
                  } else {
                      return false;
                  }
              });
          }
          urlData[tab.id] = js.data.children;
          updateTabBadge(tab);
      }

  }

  function checkTabUpdate(tab) {

      url = stripUrlHash(tab.url);
      if (tab.id in tabUrls) {
          if (tabUrls[tab.id] != url) {
              tabChangedUrl(tab, tabUrls[tab.id], url);
              tabUrls[tab.id] = url;
          } else {
              updateTabBadge(tab); // tab didn't change, but may need to refresh badge
          }
      } else {
          tabChangedUrl(tab, '', url);
          tabUrls[tab.id] = url
      }
  }

  chrome.tabs.getAllInWindow(null, function(tabs) {
      tabs.forEach(function(tab) {
          checkTabUpdate(tab);
      });
  });


  chrome.browserAction.setBadgeBackgroundColor({
      color: [0, 150, 255, 75]
  });
   // Called when the url of a tab changes.
  function checkForValidUrl(tabId, changeInfo, tab) {
      checkTabUpdate(tab);
  };

   // Listen for any changes to the URL of any tab.
  chrome.tabs.onUpdated.addListener(checkForValidUrl);
var newTab = function (url) {
    console.error("Unexpected error!")
};


// BIG OL WORKAROUND for chrome opening tabs in non-incognito windows 
// when the extension is used in an incognito window

chrome.windows.getCurrent(function (w) {
    if (w.incognito) {
        // http://stackoverflow.com/a/26216955/765210
        window.addEventListener('click', function (e) {
            if (e.target.href !== undefined && e.which < 3) {
                chrome.tabs.query({
                    currentWindow: true,
                    active: true
                }, function (tabs) {
                    var t = tabs[0];
                    chrome.tabs.create({
                        url: e.target.href,
                        index: t.index + 1,
                        active: e.which == 1,
                        openerTabId: t.id
                    });

                });
                e.preventDefault();

            }
        });
    }
});

sorts = {
    "comments": (a, b) => {
        var x = b.num_comments - a.num_comments;
        if (x !== 0)
            return x;
        return b.score - a.score;
    },
    "score": (a, b) => {
        return b.score - a.score;
    },
    "date": (a, b) => {
        return b.created - a.created;
    },
};

window.onload = function () {
    chrome.tabs.getSelected(null, function (currentTab) {
        chrome.storage.sync.get({
            sort: 'score',
            dark: false
        }, function (items) {
         
            document.body.classList.toggle("dark", items.dark);

            bg = chrome.extension.getBackgroundPage();
            data = bg.getUrlData(currentTab.id);

            if (data.length == 0) {
                thisUrl = bg.getUrl(currentTab.id);
                chrome.tabs.create({
                    url: 'https://www.reddit.com/submit?url=' + encodeURIComponent(thisUrl)
                });
            }

            posts = []

            data.forEach(function (row) {
                if (row.kind != 't3') {
                    console.error("unexpected row kind: " + row.kind);
                    return;
                }
                posts.push(row.data);
            });

            posts.sort(sorts[items.sort]);

            html = '';
            posts.forEach(function (post) {
                html += '<div class="post">\n';
                html += ('  <div class="score">' + post.score + '</div>\n');
                html += (' <div class="title"><a target="_blank" href="https://www.reddit.com' + post.permalink + '">' + post.title + '</a></div>\n');
                html += ('  <div class="meta">\n');
                html += ('    <a target="_blank" href="https://www.reddit.com' + post.permalink + '">' + post.num_comments + ' comments</a>\n');
                html += ('    submitted to <a target="_blank" href="https://www.reddit.com/r/' + post.subreddit + '" class="subreddit">' + post.subreddit + '</a>\n');
                html += ('    by <span>' + post.author + '</span>\n');
                created = new Date(post.created * 1000);
                html += ('    at <span class="created">' + created.toDateString() + '</span>\n');
                html += ("  </div>\n");
                html += ("</div>\n");
            });



            document.getElementById('content').innerHTML = html;

        });

    });
}
var newTab = function(url) {
    console.error("Unexpected error!")
};

// http://stackoverflow.com/a/26216955/765210
window.addEventListener('click',function(e){
  if(e.target.href!==undefined){
    chrome.tabs.create({url:e.target.href})
  }
});

window.onload = function() {
    chrome.tabs.getSelected(null, function(currentTab) {
        newTab = function(url) {
            chrome.tabs.create({
                url: url,
                index: currentTab.index + 1
            });
        }

        bg = chrome.extension.getBackgroundPage();
        data = bg.getUrlData(currentTab.id);

        if (data.length == 0) {
            thisUrl = bg.getUrl(currentTab.id);
            chrome.tabs.create({
                url: 'https://www.reddit.com/submit?url=' + encodeURIComponent(thisUrl)
            });
        }

        posts = []

        data.forEach(function(row) {
            if (row.kind != 't3') {
                console.error("unexpected row kind: " + row.kind);
                return;
            }
            posts.push(row.data);
        });

        posts.sort(function(a, b) {
            return b.score - a.score
        });

        html = '';
        posts.forEach(function(post) {
            html += '<div class="post">\n';
            html += ('  <div class="score">' + post.score + '</div>\n');
            html += (' <div class="title"><a href="https://www.reddit.com' + post.permalink + '">'+ post.title + '</a></div>\n');
            html += ('  <div class="meta">\n');
            html += ('    <a href="https://www.reddit.com' + post.permalink + '">' + post.num_comments + ' comments</a>\n');
            html += ('    submitted to <a href="https://www.reddit.com/r/'+post.subreddit+'" class="subreddit">' + post.subreddit + '</a>\n');
            html += ('    by <span>' + post.author + '</span>\n');
            created = new Date(post.created * 1000);
            html += ('    at <span class="created">' + created.toDateString() + '</span>\n');
            html += ("  </div>\n");
            html += ("</div>\n");
        });



        document.getElementById('content').innerHTML = html;

    });

}
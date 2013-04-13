var api = "https://api.stackexchange.com/2.1/questions?";
var filter = '!3y)18yprZhEubM2P-';

function pretty_print_json(json) {
    'use strict';
    var indentation = 4;
    var out = JSON.stringify(json, undefined, indentation);
    return out;
}

function construct_request(site, tags, period) {
    'use strict';
    var request = api;
    request += "order=desc&";
    request += "sort=votes&";
    request += "site=" + site + "&";
    if (tags.length !== 0) {
        request += "tagged=" + tags.join(";") + "&";
    }
    if (period !== null) {
        request += "fromdate=" + period.start + "&";
        request += "todate=" + period.end + "&";
    }
    request += "filter=" + filter + "&";
    return request;
}

function debug_json_request(data, textStatus, jqXHR) {
    'use strict';
    var pretty_data = pretty_print_json(data);
    $('#rawjson').text(pretty_data);
}

function make_raw_request(request_url, success_func, error_func) {
    'use strict';
    $.ajax({
        url: request_url,
        dataType: 'json',
        success: success_func,
        error: error_func});
}

function get_time_range(type) {
    'use strict';
    if (type === "All time") {
        return null;
    }
    var current = new Date();
    var mapping = {
        "This year":  365 * 24,
        "This month": 30 * 24,
        "This week":  7 * 24,
        "This day":   24,
        "This hour":  1
    };
    var previous = new Date();
    previous.setHours(current.getHours() - mapping[type]);
    var struct = {
        start: Math.floor(previous.getTime() / 1000),
        end: Math.floor(current.getTime() / 1000)
    };
    return struct;
}

function split_tags(tags) {
    'use strict';
    var re = new RegExp("[,; ]+");
    var out = tags.split(re);
    return out;
}

function clean_number(num) {
    'use strict';
    if (num >= 10000) {
        var new_num = Math.round(num / 1000);
        return new_num.toString() + '<span class="thousands">k</span>';
    } else {
        return num.toString();
    }
}

function make_question(scores, answers, views, title, link, tags) {
    'use strict';
    var out = [];
    var i;
    out.push('<div class="question">');
    out.push('<div class="votes box">');
    out.push('<div class="count">#</div>'.replace('#', scores));
    if (scores === 1) {
        out.push('<div class="type">vote</div>');
    } else {
        out.push('<div class="type">votes</div>');
    }
    out.push('</div>');
    out.push('<div class="answers box">');
    out.push('<div class="count">#</div>'.replace('#', answers));
    if (answers === 1) {
        out.push('<div class="type">answer</div>');
    } else {
        out.push('<div class="type">answers</div>');
    }
    out.push('</div>');
    out.push('<div class="views box">');
    out.push('<div class="count">#</div>'.replace('#', views));
    if (views === 1) {
        out.push('<div class="type">view</div>');
    } else {
        out.push('<div class="type">views</div>');
    }
    out.push('</div>');
    out.push('<div class="side">');
    out.push('<h3 class="title"><a href="' + link + '">' + title + '</a></h3>');
    out.push('<ul class="tags">');
    
    if (tags.length !== 0) {
        var site = new RegExp('(.+)questions').exec(link)[0] + '/tagged/';
        for (i = 0; i < tags.length; i += 1) {
            var tag_url = site + tags[i];
            out.push('<li><a href="' + tag_url + '">' + tags[i] + '</a></li>');
        }
    }
    out.push('</ul></div></div>');
    return out.join('\n');
}

function display(data, textStatus, jqXHR) {
    'use strict';
    $('#questions').empty();
    if (data['items'].length == 0) {
        $('#questions').text('None found!');
        return;
    }
    jQuery.each(data['items'], function(index, value) {
        var html = make_question(
            clean_number(value['score']),
            clean_number(value['answer_count']),
            clean_number(value['view_count']),
            value['title'],
            value['link'],
            value['tags']
        );
        $('#questions').append(html);
    });
}

function handle_failure(data, textStatus, jqXHR) {
    var out = [];
    var root = $.parseJSON(data['responseText']);
    out.push('<p>Error: ' + root['error_id'] + ' ' + root['error_name'] + '</p>');
    out.push('<p>' + root['error_message'] + '</p>');
    $('#errors').append(out.join('\n'));
}

function bind_form_trigger() {
    'use strict';
    $("#submit").click(function() {
        $('#errors').empty();
        
        var site = $.trim($('#site_input').val());
        var periods = get_time_range(
            $.trim($('#period_input option:selected').text())
        );
        var tags = split_tags(
            $.trim($('#tags_input').val())
        );
        
        if (tags.length > 5) {
            $('#errors').append("You have more then 5 tags.");
            return;
        }
        
        var request = construct_request(site, tags, periods);
        
        make_raw_request(request, display, handle_failure);
    });
}
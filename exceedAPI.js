let exceed = {
    url: '',
    prefix: '',
    configure: function (config){
        this.url = config.url
        this.prefix = config.prefix
    },
    getVal: function (name, callback, type, optdata) {
        if (!type) type = "view"
        $.ajax({
            type: "GET",
            url: `${this.url}${this.prefix}${name}/${type}/`,
            data: (optdata) ? optdata : {},
            dataType: "text",
            success: function (response) {
                if (typeof callback == "function") callback(response)
            },
            fail: function (response) {
                console.log(`<getVal> Failed AJAX getting [${name}] value: ${response}`)
                if (typeof callback == "function") callback(null)
            }
        });
    },
    saveVal: function (name, val, callback) {
        $.ajax({
            type: "GET",
            url: `${this.url}${this.prefix}${name}/set/`,
            data: { value: val },
            dataType: "json",
            success: function (response) {
                if (response.status) {
                    if (response.status == 'success') {
                        if (typeof callback == "function") callback(true)
                    } else {
                        console.log(`<saveVal> Failed API saving [${name}] value`)
                        if (typeof callback == "function") callback(false)
                    }
                } else {
                    console.log(`<saveVal> API not return status`)
                }
            },
            fail: function (response) {
                console.log(`<saveVal> Failed AJAX saving [${name}] value: ${response}`)
                if (typeof callback == "function") callback(false)
            }
        });
    },
    getHistory: function (name, callback, limit, before, after) {
        console.log(`<getHistory> Redirecting to getVal...`)
        this.getVal(name, (typeof callback != "undefined") ? callback : null, "history",
            {
                limit: (limit) ? limit : null,
                before: (before) ? before : null,
                after: (after) ? after : null
            })
    }
}
let exceed = {
    url: 'http://ecourse.cpe.ku.ac.th:1515/api/',
    prefix: 'palmyut-',
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
let isLoaded = {

};
let checkLoadCnt = function (total, callback) {
    let total = 0;
    for (var i = 0; i < shower.dataList.length; i++) {
        total += isLoaded[shower.dataList[i]]
    }
    console.log("<checkLoadCnt> cnt " + cnt + " total " + total)
    if (cnt == total) {
        callback();
    }
}
let shower = {
    dataList: [''],

    updateData: function (name) {
        for (var i = 0; i < this.dataList.length; i++) {
            console.log(`<updateData> ${this.dataList[i]} START!`)
            let key = this.dataList[i]
            exceed.getVal(key, function (resp) {
                isLoaded[key] = 1
                checkLoadCnt(shower.dataList.length, function () {
                    $('#cover-spin').hide();
                })

                console.log(`<updateData> ${key} RESP: ${resp}`)
                if (resp == null || resp == "") {
                    this[key] = "N/A"
                } else {
                    this[key] = resp
                }

                /*
                if(key.indexOf('_state')!=-1){
                    if(this[key]==1)
                        $('#'+key).prop('checked','true')
                    else 
                        $('#'+key).removeProp('checked')
                } else if(key=="temperature"||key=="humidity"||key=="light_intensity") {
                    $('#'+key).text(this[key])
                }
                */

            })
        }
    }
}
$(function () {
    $('#cover-spin').show(0)

    shower.updateData()
    setInterval(function () { shower.updateData() }, 7000)
})
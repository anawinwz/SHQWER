let isLoaded = {
    //TODO: Set dataList
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

                //TODO: HTML Change

            })
        }
    }
}
$(function () {
    exceed.configure({url:'http://ecourse.cpe.ku.ac.th:1515/api/',prefix:'palmyut-'})
    $('#cover-spin').show(0)

    shower.updateData()
    setInterval(function () { shower.updateData() }, 7000)
})
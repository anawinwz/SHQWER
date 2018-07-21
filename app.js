let isLoaded = {
    //TODO: Set dataList
};
let checkLoadCnt = function (total, callback) {
    let cnt = 0;
    for (var i = 0; i < shower.dataList.length; i++) {
        cnt += isLoaded[shower.dataList[i]]
    }
    console.log("<checkLoadCnt> cnt " + cnt + " total " + total)
    if (cnt == total) {
        callback();
    }
}
let shower = {
    dataList: [''],

    userId: -1,
    isFirstLoaded: false,


    updateDataSingle: function (key) {
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
    },
    updateData: function () {
        if(!this.isFirstLoaded){
            this.isFirstLoaded = true
            exceed.getVal("lastUserId",function(resp){
                shower.userId = parseInt(resp)+1
            })
        }
        for (var i = 0; i < this.dataList.length; i++) {
            console.log(`<updateData> ${this.dataList[i]} START!`)
            let key = this.dataList[i]
            this.updateDataSingle(key)
        }
    },

}
$(function () {
    exceed.configure({url:'http://ecourse.cpe.ku.ac.th/exceed/api/',prefix:'palmyut-'})
    //0$('#cover-spin').show(0)

    shower.updateData()
    setInterval(function () { shower.updateData() }, 7000)
})
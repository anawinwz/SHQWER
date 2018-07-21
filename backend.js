let backend = {
    dataList: ['walkin','walkout','localswitch', 'webswitch', 'Temperature', 'Huminity', 'currQueue_A', 'currQueue_B','lastUserId','avgM','Mcnt'],
    localswitch: 1,
    Temperature: 0,
    walkin: 0,
    walkout: 0,
    Huminity: 0,
    currQueue_A: "",
    currQueue_B: "",
    lastUserId: 0,
    avgM: 0,
    Mcnt: 0,
    webswitch: 0,
    prepareTable: function(){
        for(var key in this.dataList) 
        $('#backendTbl').append(`<tr><td>${this.dataList[key]}</td><td><span id="${this.dataList[key]}">Loading...</span></td></tr>`)
    },
    updateDataSingle: function (key) {
        exceed.getVal(key, function (resp) {
            console.log(`<updateData> ${key} RESP: ${resp}`)

            if (resp == null || resp == "") {
                this[key] = "N/A"
            } else {
                this[key] = resp
            }
            console.log(this.key)
            $(`#${key}`).html(this[key])

        })
    },
    updateData: function () {
        console.log("------ Update ------")
        for (var i = 0; i < this.dataList.length; i++) {
            // console.log(`<updateData> ${this.dataList[i]} START!`)
            let key = this.dataList[i]
            this.updateDataSingle(key)
        }
    },
}
$(function () {
    exceed.configure({ url: 'http://ecourse.cpe.ku.ac.th/exceed/api/', prefix: 'palmyut-' })
    backend.prepareTable()
    backend.updateData()
    setInterval(function() {backend.updateData()},3000)

})
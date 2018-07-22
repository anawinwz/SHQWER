let backend = {
    dataList: ['roomA1_state','roomA1_start','walkin','walkout','localswitch', 'webswitch','avgM','Mcnt', 'Temperature', 'Huminity','lastUserId'],
    dataName: {
        walkin: 'People walked-in',
        walkout: 'People walked-out',
        localswitch: '[Room A1] Lock Status',
        webswitch: '[Room A1] Booking Status',
        Temperature: 'Temperature (°C)',
        Huminity: 'Humidity',
        lastUserId: 'User(s)',
        avgM: '[Room A1] Average Usage Time (miliseconds)',
        Mcnt: '[Room A1] Usage Count (times)',
        roomA1_state: 'roomA1_state',roomA1_start: 'roomA1_start',
    },
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
        $('#backendTbl').append(`<tr><td class="text-light">${this.dataName[this.dataList[key]]} <i class="text-muted">&lt;${this.dataList[key]}&gt;</i></td><td><span class="text-light" id="${this.dataList[key]}">Loading...</span></td></tr>`)
    },
    updateDataSingle: function (key) {
        exceed.getVal(key, function (resp) {
            console.log(`<updateData> ${key} RESP: ${resp}`)

            if (resp == null || resp == "") {
                this[key] = "N/A"
            } else {
                this[key] = resp
            }
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
    $('#dataModal').modal({show:false})
    $('[data-action="history"]').click(function(){
        $('#dataModal_body').html(`
        <div class="alert alert-info p-1">Showing only latest 100 values; shown times are in GMT timezone.</div>
                    <canvas id="dataChart" width="400" height="400"></canvas>
                    <table class="table table-condensed" id="dataTable">
                        <tr><th>Date/Time</th><th>Value</th></tr>
                    </table>`)
        let thisData = $(this).data()
        exceed.getHistory(thisData.val,function(resp){
            resp = JSON.parse(resp)

            let dataVal = []
            let dataKey = []
            for(var key in resp){
                //resp[key].created_at = new Date(Date.parse(resp[key].created_at.replace(" ","T")+"+00:00"))
                if((thisData.val!="avgM" &&( resp[key].value<-100 || resp[key].value >100))||(thisData.val=="Temperature" && resp[key].value<15)) continue
                dataVal.push(resp[key].value)
                dataKey.push(resp[key].created_at)
                $('#dataTable').append(`<tr><td>${resp[key].created_at}</td><td>${resp[key].value}</td></tr>`)
            }
            var ctx = document.getElementById("dataChart").getContext('2d');
            var myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dataKey,
                    datasets: [{
                        label: thisData.val,
                        data: dataVal,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255,99,132,1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero:true
                            }
                        }]
                    }
                }
            });
            $('#dataModal').modal('show')
        },100)
    })
})
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
    dataList: ['localswitch', 'Temperature', 'Huminity', 'avgM', 'Mcnt'],
    localswitch: 1,
    Temperature: 0,
    Huminity: 0,
    avgM: 0,
    Mcnt: 0,

    startTime: 0,
    reloadCnt: 0,

    rState: { AVAILABLE: 0, PENDING: 1, OCCUPIED: 2 },
    rGender: { A: 'M', B: 'M' },
    subRoomCnt: 3,//5
    roomData: {
        A: [],
        B: []
    },

    userId: -1,
    isFirstLoaded: false,

    queuedRoom: '',

    updateDataSingle: function (key) {
        exceed.getVal(key, function (resp) {
            isLoaded[key] = 1
            if (!shower.isFirstLoaded)
                checkLoadCnt(shower.dataList.length, function () {
                    $('#cover-spin').hide();
                    shower.isFirstLoaded = true
                })
            let oldVal = shower[key]
            console.log(`<updateData> ${key} RESP: ${resp}`)

            if (resp == null || resp == "") {
                shower[key] = "N/A"
            } else {
                shower[key] = resp
            }

            $(`#${key}`).text(shower[key])

            if (key == "localswitch") {
                if (oldVal == 1 && resp == 0) {
                    //Become unavailable
                    shower.startTime = Date.now()
                    exceed.saveVal('roomA1_start', shower.startTime)
                    exceed.saveVal('roomA1_state', 1)
                    exceed.saveVal('webswitch', 1)
                } else if (oldVal == 0 && resp == 1) {
                    //Become available
                    exceed.getVal("avg" + shower.rGender['A'], function (avg) {
                        exceed.getVal(shower.rGender['A'] + "cnt", function (cnt) {
                            console.log((Date.now() - shower.startTime) / 1000 + " secs")
                            cnt = parseInt(cnt) + 1
                            avg = (parseInt(avg) * cnt + (Date.now() - shower.startTime)) / cnt
                            exceed.saveVal("avg" + shower.rGender['A'], avg)
                            exceed.saveVal(shower.rGender['A'] + "cnt", cnt)
                            exceed.saveVal('roomA1_start', 0)
                            exceed.saveVal('roomA1_state', 0)
                        })
                    })
                    shower.reloadQueue("A", function (qjson) {
                        while (qjson.length != 0) {
                            for (var userId in qjson) {
                                if (qjson[userId][0] == 1 && qjson[userId][1] != 0 && Date.now() - qjson[userId][1] > 1000 * 1 * 55) {
                                    //Jong Timeout
                                    shower.dequeue('A', userId)
                                    exceed.saveVal('webswitch', 1)
                                    exceed.saveVal('roomA1_start', 0)
                                    exceed.saveVal('roomA1_state', 0)
                                }
                                break;
                            }
                        }
                    })
                }
            } else if(key=="Temperature"||key=="Huminity"){
                if(shower[key]<-100||shower[key]>100) {
                    shower[key] = "N/A"
                }
            }



        })
    },
    updateData: function () {
        console.log("------ Update ------")

        shower.reloadRoom('A')
        shower.reloadRoom('B')
        if (!this.isFirstLoaded && this.userId == -1) {
            exceed.getVal("lastUserId", function (resp) {
                shower.userId = parseInt(resp) + 1
                exceed.saveVal("lastUserId", shower.userId, function (isOK) {

                })
            })
        }
        for (var i = 0; i < this.dataList.length; i++) {
            // console.log(`<updateData> ${this.dataList[i]} START!`)
            let key = this.dataList[i]
            this.updateDataSingle(key)
        }
    },
    reloadQueue: function (room, callback) {
        exceed.getVal(`currQueue_${room}`, function (qjson) {
            qjson = (qjson) ? JSON.parse(qjson.replace(/&quot;/g, '"')) : {}
            console.log(`<reloadQueue> Got current ${room} queue:`)
            console.log(qjson)
            if (typeof callback == "function") callback(qjson)
        })
    },
    reloadRoom: function (room, callback) {
        shower.roomData[room] = []
        shower.reloadCnt = 0

        for (var i = 1; i <= shower.subRoomCnt; i++) {
            let subRoom = i
            exceed.getVal(`room${room}${subRoom}_start`, function (start) {
                start = parseInt(start)
                exceed.getVal(`room${room}${subRoom}_state`, function (state) {
                    console.log(`---room${room}${subRoom}---`)
                    console.log("start: " + start)
                    console.log("state: " + state)
                    // console.log("Date.now(): " + Date.now())
                    // console.log("FinalVal: " + (Date.now() - start))
                    shower.reloadCnt++
                    shower.roomData[room].push({
                        roomId: subRoom,
                        start: (state != 0) ? start : 0,
                        state: state,
                        timeLeft: (start <= 0) ? 0 : parseInt(shower["avg" + shower.rGender[shower.queuedRoom]]) - (Date.now() - start)
                    })
                    if (state == 0 || (state == -1 && Date.now() - start > 1000 * 60 * 1)) {
                        if (state == -1) {
                            console.log(`Reset booking state for ROOM ${room}${subRoom}`)
                            exceed.saveVal(`room${room}${subRoom}_state`, 0)
                            exceed.saveVal(`room${room}${subRoom}_start`, 0)
                            shower.dequeue(room, shower.userId)
                            if (room == 'A' && subRoom == 1) {
                                exceed.saveVal('webswitch', 1)
                            }
                        } else if (state == 0 && start > 0) {
                            exceed.saveVal(`room${room}${subRoom}_start`, 0)
                        }
                        $(`#room${room}${subRoom}_status`).html(`<span class="badge badge-success">Available</span>`)
                    } else if (state == 1) {
                        //AI 
                        if ((room == 'A' && subRoom != 1) || room == 'B') {
                            if(Date.now()-start>30*60*1000)
                            setTimeout(() => { exceed.saveVal(`room${room}${subRoom}_status`,0);exceed.saveVal(`room${room}${subRoom}_start`,0)}, getRandomInt(5000,15000))
                        }
                        $(`#room${room}${subRoom}_status`).html('<span class="badge badge-danger">In Used</span>')
                    } else {

                        $(`#room${room}${subRoom}_status`).html('<span class="badge badge-warning">Booking</span>')
                    }


                    if (typeof callback == "function") setTimeout(() => { if (shower.reloadCnt == shower.subRoomCnt) { callback(); shower.reloadCnt = 0 } }, 500)
                })
            })
        }
    },

    enqueue: function (room, userId, callback) {
        this.reloadQueue(room, function (qjson) {
            qjson[userId] = { 0: 0, 1: 0 }
            exceed.saveVal(`currQueue_${room}`, JSON.stringify(qjson), function (isOK) {
                console.log(`<enqueue> Saved ${room} queue.`)
                if (typeof callback == "function") callback(qjson)
            })
        })
    },
    dequeue: function (room, userId, callback) {
        this.reloadQueue(room, function (qjson) {
            delete qjson[userId]
            exceed.saveVal(`currQueue_${room}`, JSON.stringify(qjson), function (isOK) {
                console.log(`<dequeue> Saved ${room} queue.`)
                if (typeof callback == "function") callback(qjson)
            })
        })
    },
    findQueueNo: function (userId, qjson) {
        let i = 1;
        for (var qUserId in qjson) {
            if (userId == qUserId) {
                return i;
            }
            if (qjson[0] == 0) i++;
        }
    },

    switchRoom: function (callback) {
        if (this.queuedRoom == '') return false

        let targetRoom
        switch (this.queuedRoom) {
            case 'A': targetRoom = 'B'; break
            case 'B': targetRoom = 'A'; break
        }

        this.dequeue(this.queuedRoom, this.userId, function () {
            shower.enqueue(targetRoom, shower.userId, function () {
                shower.queuedRoom = targetRoom

                if (typeof callback == "function") callback()
            })
        })
    },
    bookRoom: function (room, callback) {
        if (this.queuedRoom != '') return false
        this.enqueue(room, shower.userId, function (qjson) {
            shower.queuedRoom = room
            console.log("OK! Your queue number is " + shower.findQueueNo(shower.userId, qjson))
            if (typeof callback == "function") callback()
        })
    },
    selectSubRoom: function (callback) {
        if (!shower.queuedRoom) return false
        shower.reloadQueue(shower.queuedRoom, function (qjson) {
            let qNo = shower.findQueueNo(shower.userId, qjson)
            let estTime = shower["avg" + shower.rGender[shower.queuedRoom]]
            shower.reloadRoom(shower.queuedRoom, function () {
                console.log("reloadRoom")
                console.log(shower.roomData[shower.queuedRoom])
                /*
                let fastestRoom = Array(shower.roomData[shower.queuedRoom]).reduce(function (l, e) {
                    return (e.timeLeft < l.timeLeft || (e.roomId < l.roomId && e.timeLeft == l.timeLeft)) ? e : l;
                });*/
                let fastestRoom = shower.roomData[shower.queuedRoom].sort(function IHaveAName(a, b) { // non-anonymous as you ordered...
                    return b.timeLeft < a.timeLeft ?  1 // if b should come earlier, push a to end
                         : b.roomId > a.roomId ? -1 // if b should come later, push a to begin
                         : 0;                   // a and b are equal
                });

                fastestRoom = Array(fastestRoom)[0]
                console.log("Getting fastestRoom!")
                console.log(fastestRoom)
                console.log("qNo:" + qNo)
                if (qNo >= shower.subRoomCnt) {
                    console.log(fastestRoom[shower.subRoomCnt - 1])
                    estTime = Date.now() - fastestRoom[shower.subRoomCnt - 1].start + (shower.subRoomCnt) * shower["avg" + shower.rGender[shower.queuedRoom]]
                } else if (qNo > 1) {
                    console.log(fastestRoom[qNo - 1])
                    estTime = Date.now() - fastestRoom[qNo - 1].start
                } else {

                    console.log(fastestRoom[0])
                    if (fastestRoom[0].start == 0) {
                        //Available to Enter
                        console.log(`YOUR QUEUE! Put to Room ${fastestRoom[0].roomId}`)
                        shower.reloadQueue(shower.queuedRoom, function (qjson) {
                            qjson[shower.userId] = {
                                0: fastestRoom[0].roomId,
                                1: Date.now()
                            }
                            exceed.saveVal(`currQueue_${shower.queuedRoom}`, JSON.stringify(qjson), function (isOK) {
                                console.log(`<checkJong> Saved ${shower.queuedRoom} queue.`)
                                if (typeof callback == "function") callback(qjson)
                            })
                        })
                        estTime = -1
                        if (fastestRoom[0].roomId == 1 && shower.queuedRoom == 'A') {
                            //Real Board Room
                            //TODO: Hello your queue
                            //TODO: Set Jong status to HW
                            console.log(`Set LED status for Room A1`)
                            exceed.saveVal("webswitch", 0)
                            exceed.saveVal("roomA1_start", Date.now())
                            exceed.saveVal("roomA1_state", -1)
                        } else {
                            console.log(`Set start for Room ${shower.queuedRoom}${fastestRoom[0].roomId}`)
                            //AI
                            exceed.saveVal(`room${shower.queuedRoom}${fastestRoom[0].roomId}_start`, Date.now())
                            exceed.saveVal(`room${shower.queuedRoom}${fastestRoom[0].roomId}_state`, -1)
                            setTimeout(() => { exceed.saveVal(`room${shower.queuedRoom}${fastestRoom[0].roomId}_state`, Math.round(Math.random())) }, 25000)
                        }

                    } else {
                        estTime = Date.now() - fastestRoom[0].start
                        if (estTime < 60000) {
                            estTime = 60000
                        }
                    }
                }
                console.log(`YOUR ESTIMATED TIME: ${estTime / 60000}mins`)
                let estTime_mins = (estTime == -1) ? -1 : Math.floor(estTime / 60000)

                //AI Bot Setting - Back to Available
                if (estTime_mins != -1 && (shower.queuedRoom == 'B' || (shower.queuedRoom == 'A' && fastestRoom[0].roomId != 1))) {
                    setTimeout(() => { exceed.saveVal(`room${shower.queuedRoom}${fastestRoom[0].roomId}_start`, 0) }, estTime_mins * 1000 * 59)
                }

                $('#bookModal_btn').hide()
                shower.queuedRoom = ''
                if (estTime_mins != -1) {
                    if (isFirstSearch) {
                        $('#bookModal_title').text('Booking Success!')
                        $('#bookModal_body').html(`
                    <h3 class="themeFont">ROOM A</h3>
                    Your Shower Room will be <i>approximately</i> available in <b>${estTime_mins} min(s)</b>!
                    `)
                        isFirstSearch = false
                    }
                } else {
                    $('#bookModal_title').text('Your Room is Ready!')
                    $('#bookModal_body').html(`
                    <h3 class="themeFont">ROOM A</h3>
                    Your Shower Room is READY!<br>Enjoy freshness <b>within 1 minute</b> at Room A.<br><br>Otherwise, your booking will be cancelled.
                    `)
                    isFirstSearch = true
                    clearInterval(searchInterval)
                }
                if (typeof callback == "function") callback(estTime)

            })
        })
    }

}
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function test() {
    shower.bookRoom('A', function () {
        shower.queuedRoom = 'A'
        shower.selectSubRoom()
    })
}
let searchInterval = null
let isFirstSearch = true
$(function () {
    exceed.configure({ url: 'http://ecourse.cpe.ku.ac.th/exceed/api/', prefix: 'palmyut-' })
    //0$('#cover-spin').show(0)

    shower.updateData()
    setInterval(function () { shower.updateData() }, 3000)

    $('#bookModal').modal({ show: false })
    $('#confirmModal').modal({ show: false })
    $('#bookBtn').click(function () {
        $('#bookModal_title').text('Booking...')
        $('#bookModal_body').html(`<h2 class="themeFont" id="zoneTxt">PLEASE WAIT</h2>
        Searching nearest and fastest Shower Room for you...`)
        $('#bookModal_btn').show()
        $('#bookModal').modal('show')
        setTimeout(() => { 
            $('#zoneTxt').text('ROOM A');
            shower.bookRoom('A', function () {
                shower.queuedRoom = 'A'
                searchInterval = setInterval(function () { shower.selectSubRoom() }, 1000)
                shower.selectSubRoom()
            }) 
        }, 6000)
        
        return false
    })
    $('#cancelBtn').click(function () {
        $('#confirmModal').modal('show')

    })
})
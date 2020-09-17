let grpc = require('grpc')
let sleep = require('sleep')
let messages = require('./common/landing_pb')
let services = require('./common/landing_grpc_pb')


function grpcServer() {
    let server = process.env.GRPC_SERVER;
    if (typeof server !== 'undefined' && server !== null) {
        return server
    } else {
        return "localhost"
    }
}

function talk(client, request) {
    client.talk(request, function (err, response) {
        let result = response.getResultsList()[0]
        let kvMap = result.getKvMap()
        console.log("Talk:" + kvMap.get("meta"))
    })
}

function talkOneAnswerMore(client, request) {
    let mark = false
    let call = client.talkOneAnswerMore(request)
    call.on('data', function (response) {
        let result = response.getResultsList()[0]
        let kvMap = result.getKvMap()
        if (!mark) {
            console.log("TalkOneAnswerMore:" + kvMap.get("meta"))
            mark = true
        }
    })
}

function talkMoreAnswerOne(client, requests) {
    let call = client.talkMoreAnswerOne(function (err, response) {
        let result = response.getResultsList()[0]
        let kvMap = result.getKvMap()
        console.log("TalkMoreAnswerOne:" + kvMap.get("meta"))
    })
    requests.forEach(request => {
        call.write(request)
    })
    call.end()
}

function talkBidirectional(client, requests) {
    let mark = false
    let call = client.talkBidirectional()
    call.on('data', function (response) {
        let result = response.getResultsList()[0]
        let kvMap = result.getKvMap()
        if (!mark) {
            console.log("TalkBidirectional:" + kvMap.get("meta"))
            mark = true
        }
    })
    requests.forEach(request => {
        sleep.msleep(5)
        call.write(request)
    })
    call.end()
}

function randomId(max) {
    return Math.floor(Math.random() * Math.floor(max)).toString()
}

function main() {
    let address = grpcServer() + ":9996";
    let c = new services.LandingServiceClient(address, grpc.credentials.createInsecure())

    let request = new messages.TalkRequest()
    request.setData("0")
    request.setMeta("NODEJS")
    talk(c, request)
    sleep.msleep(50)
    request = new messages.TalkRequest()
    request.setData("0,1,2")
    request.setMeta("NODEJS")
    talkOneAnswerMore(c, request)
    sleep.msleep(50)
    let r1 = new messages.TalkRequest()
    r1.setData(randomId(5))
    r1.setMeta("NODEJS")
    let r2 = new messages.TalkRequest()
    r2.setData(randomId(5))
    r2.setMeta("NODEJS")
    let r3 = new messages.TalkRequest()
    r3.setData(randomId(5))
    r3.setMeta("NODEJS")
    let rs = [r1, r2, r3]
    talkMoreAnswerOne(c, rs)
    sleep.msleep(50)
    talkBidirectional(c, rs)
}

main()
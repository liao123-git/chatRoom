const WebSocket = require( 'ws' )
const peopleList = {}
const clients = {}

const wss = new WebSocket.WebSocketServer( { port: 3000 } )

wss.on( 'connection', function connection ( ws ) {
    ws.on( 'message', function connection ( msg ) {

        const msgObj = JSON.parse( msg.toString() )

        const api = {
            login () {
                !peopleList[msgObj.roomId] && (peopleList[msgObj.roomId] = {})
                if ( !peopleList[msgObj.roomId][msgObj.nickname] ) {

                    peopleList[msgObj.roomId][msgObj.nickname] = msgObj
                    ws.nickname = msgObj.nickname
                    ws.roomId = msgObj.roomId
                    clients[msgObj.nickname] = ws

                    ws.send( JSON.stringify( { ...msgObj, has: false } ) )

                    for ( let i in clients ) {
                        const client = clients[i]
                        if ( client.readyState === WebSocket.OPEN && client.roomId === ws.roomId ) {
                            client.send( JSON.stringify( { ...msgObj, event: "welcome" } ) )
                            client.send( JSON.stringify( {
                                event: "peopleList",
                                peopleList: peopleList[msgObj.roomId]
                            } ) )
                        }
                    }
                } else {
                    ws.send( JSON.stringify( { ...msgObj, has: true } ) )
                }
            },
            message () {
                for ( let i in clients ) {
                    const client = clients[i]
                    if ( client.readyState === WebSocket.OPEN && client.roomId === ws.roomId ) {
                        client.send( msg.toString() )
                    }
                }
            }
        }

        api[msgObj.event]?.()
    } )

    ws.on( 'close', function connection () {
        if ( ws.nickname && peopleList[ws.roomId][ws.nickname] ) {

            const backup = peopleList[ws.roomId][ws.nickname]
            backup.event = 'leave'

            delete peopleList[ws.roomId][ws.nickname]
            delete clients[ws.nickname]

            for ( let i in clients ) {
                const client = clients[i]
                if ( client.readyState === WebSocket.OPEN && client.roomId === ws.roomId ) {
                    client.send( JSON.stringify( backup ) )
                    client.send( JSON.stringify( { event: "peopleList", peopleList } ) )
                }
            }

        }
    } )

} )
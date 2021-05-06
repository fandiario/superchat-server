const express = require ("express")
const mysql = require ("mysql")
const cors = require ("cors")
const http = require ("http")
const socket = require ("socket.io")

// Init Variable
const app = express ()
app.use (cors ())
const httpApp = http.createServer (app)
const io = socket (httpApp)

// Init PORT
const PORT = 5000

// Routes
app.get ("/", (req, res) => {
    res.send ("Hello from Superchat Server")
})

let userConnected = []

io.on ("connection", (socket) => {
    console.log (`User is conncted. Id number: ${socket.id}`)

    // If there's new user join 
    socket.on ("user-join", ({username, room}) => {

        // Check total user in a room
        let checkTotalUser = userConnected.filter ((value) => value.room === room)

        socket.emit ("total-user", checkTotalUser.length)
        

        if (checkTotalUser.length < 5) {
            // Push to user connected array user's data
            userConnected.push ({
                id: socket.id,
                username: username,
                room: room
            })

            // Preparation to join the room
            socket.join (room)

            // Filtering... which room is it ?
            let userInRoom = userConnected.filter ((value) => value.room === room)

            // To see who is in this room already
            io.in (room).emit ("user-online", userInRoom)

            // Tell everybody in those room except the user that there's new member joining
            socket.to (room).emit ("send-message-from-bot", {from:"Bot", message: `${username} has joined.`})
        }
        
    })

    // Send message chat
    socket.on ("send-user-message", (data) => {
        let index = null

        userConnected.forEach ((el, i) => {
            if (el.id === socket.id) {
                index = i
            }
        })

        let room = userConnected[index].room

        socket.to (room).emit ("send-user-message-back", {from: data.username, message: data.message})
        socket.emit ("send-user-message-back", {from: data.username, message: data.message})
    })

    // See who is typing
    socket.on ("user-typing-message", (data) => {
        let index = null

        userConnected.forEach ((el, i) => {
            if (el.id === socket.id) {
                index = i
            }
        })

        let room = userConnected[index].room

        socket.to(room).emit ("user-is-typing", {from: data.username, message: data.message})
    })

    // If leave room 
    socket.on ("disconnect", () => {
        let index = null
        // console.log (userConnected)

        userConnected.forEach ((el, i) => {
            if (el.id === socket.id) {
                index = i
            }
        })

        if (index !== null) {
            var username = userConnected[index].username
            var room = userConnected[index].room

            userConnected.splice (index, 1)
        }

        socket.to (room).emit ("send-message-from-bot", {from:"Bot", message: `${username} has left.`})
    })

    

})





// Create Server
httpApp.listen (PORT, () => {
    console.log (`Server is listening on port : ${PORT}`)
})

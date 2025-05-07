const db = require("../utils/dbpool")
const {apiSuccess, apiError} = require("../utils/apiresult")
const {createToken} = require("../utils/jwtauth")
const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()

router.get("/:id", (req, resp) => {
    db.query("SELECT * FROM user WHERE id=?", [req.params.id],
        (err, results) => {
            if(err)
                return resp.send(apiError(err))
            if(results.length !== 1)
                return resp.send(apiError("User not found"))
            return resp.send(apiSuccess(results[0]))
        }
    )
})

router.post("/signup", (req, resp) => {
    const {firstName, lastName, email,  password, phoneno, address} = req.body
    const encPasswd = bcrypt.hashSync(password, 10)
    db.query("INSERT INTO user (firstName, lastName, email,  password, phoneno, address) VALUES (?, ?, ?, ?, ?, ?)",
        [firstName, lastName, email,  encPasswd, phoneno, address],
        (err, result) => {
            if(err)
                return resp.send(apiError(err))
            if(result.affectedRows === 1) {
                db.query("SELECT * FROM user WHERE id=?", [result.insertId],
                    (err, results) => {
                        if(err)
                            return resp.send(apiError(err))
                        resp.send(apiSuccess(results[0]))
                    }
                )
            }
        }
    )
})

module.exports = router

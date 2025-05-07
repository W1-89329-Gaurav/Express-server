const db = require("../utils/dbpool")
const {apiSuccess, apiError} = require("../utils/apiresult")
const {createToken} = require("../utils/jwtauth")
const express = require("express")
const bcrypt = require("bcrypt")
const router = express.Router()


router.get("", (req, resp) => {
    db.query("SELECT * FROM quote", (err, results) => {
        if(err)
            return resp.send(apiError(err))
        resp.send(apiSuccess(results))
    })
})

router.get("/:id", (req, resp) => {
    db.query("SELECT * FROM quote WHERE id=?", [req.params.id],
        (err, results) => {
        if(err)
            return resp.send(apiError(err))
        if(results.length !== 1)
            return resp.send(apiError("Requested Quote Record not found"))
        return resp.send(apiSuccess(results[0]))
    })
})

router.post("", (req, resp) => {
    const {userId, author, contents, createdTime} = req.body
    db.query("INSERT INTO quote(UserId, author, contents, createdTime) VALUES(?, ? , ? ,NOW())",
        [userId, author, contents ,createdTime ], (err, result) => {
            if(err)
                return resp.send(apiError(err))
            if(result.affectedRows === 1) {
                db.query("SELECT * FROM quote WHERE id=?", [result.insertId],
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

router.delete("/:id", (req, resp) => {
    db.query("DELETE FROM quote WHERE id=?", [req.params.id],
        (err, result) => {
            if(err)
                return resp.send(err)
            if(result.affectedRows === 1)
                resp.send(apiSuccess("Quote deleted"))
            else
                resp.send(apiError("Quote Record not Deleted"))
        }
    )
})



module.exports = router

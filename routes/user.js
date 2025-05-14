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

// et all users
router.get("/", (req, resp) => {
    db.query("SELECT * FROM user", (err, results) => {
        if (err) return resp.send(apiError(err));
        return resp.send(apiSuccess(results));
    });
});

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

// POST /user/signin
router.post("/signin", (req, resp) => {
    const {email, password} = req.body
    db.query("SELECT * FROM user WHERE email=?", [email],
        (err, results) => {
            if(err)
                return resp.send(apiError(err))
            if(results.length !== 1) 
                return resp.send(apiError("Invalid email"))
            const dbUser = results[0]
            const isMatching = bcrypt.compareSync(password, dbUser.password)
            
            if(!isMatching) 
                return resp.send(apiError("Invalid password"))
            const token = createToken(dbUser)
            resp.send(apiSuccess({...dbUser, token})) 
        }
    )
})

router.patch("/:id", (req, resp) => {
    const { firstName, lastName, email, phoneno, address } = req.body;
    const userId = req.params.id;

    db.query(
        "UPDATE user SET firstName=?, lastName=?, email=?, phoneno=?, address=? WHERE id=?",
        [firstName, lastName, email, phoneno, address, userId],
        (err, result) => {
            if (err) return resp.send(apiError(err));
            if (result.affectedRows !== 1) return resp.send(apiError("User not found"));
            db.query("SELECT * FROM user WHERE id=?", [userId], (err2, results) => {
                if (err2) return resp.send(apiError(err2));
                if (results.length !== 1) return resp.send(apiError("User fetch failed after update"));

                return resp.send(apiSuccess({
                    message: "User profile updated successfully.",
                    user: results[0]
                }));
            });
        }
    );
});


// Delete user by ID
router.delete("/:id", (req, resp) => {
    db.query("DELETE FROM user WHERE id = ?", [req.params.id], (err, result) => {
        if (err) return resp.send(apiError(err));
        if (result.affectedRows === 0) return resp.send(apiError("User not found"));
        return resp.send(apiSuccess("User deleted successfully"));
    });
});
module.exports = router

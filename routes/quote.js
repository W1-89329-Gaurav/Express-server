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

// GET /quote/withLikedStatus/:userId
router.get("/withLikedStatus/:userId", (req, resp) => {
	const userId = req.params.userId;

	const sql = `
		SELECT q.*, 
		       CASE WHEN f.id IS NOT NULL THEN true ELSE false END AS liked
		FROM quote q
		LEFT JOIN favourite f ON f.quoteId = q.id AND f.userId = ?
	`;

	db.query(sql, [userId], (err, results) => {
		if (err) return resp.send(apiError(err));
		resp.send(apiSuccess(results));
	});
});


router.get('/userId/:userId', (req, res) => {
    const userId = req.params.userId;
    db.query("SELECT * FROM quote WHERE userId = ?", [userId], (err, results) => {
      if (err) {
        return res.status(500).send({ status: "error", message: err.message });
      }
      res.send({ status: "success", data: results });
    });
  });


router.post("", (req, resp) => {
    const { userId, author, contents } = req.body;

    db.query(
        "INSERT INTO quote(userId, author, contents, createdTime) VALUES(?, ?, ?, NOW())",
        [userId, author, contents],
        (err, result) => {
            if (err) return resp.send(apiError(err));

            if (result.affectedRows === 1) {
                db.query("SELECT * FROM quote WHERE id=?", [result.insertId], (err, results) => {
                    if (err) return resp.send(apiError(err));
                    resp.send(apiSuccess(results[0]));
                });
            }
        }
    );
});

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

router.put("/:id", (req, resp) => {
    const {userId, author, contents, createdTime} = req.body
    db.query("UPDATE quote SET userId=?, author=?, contents=? ,createdTime=? WHERE id=?",
        [userId, author, contents,createdTime, req.params.id],
        (err, result) => {
            if(err)
                return resp.send(apiError(err))
            if(result.affectedRows !== 1)
                return resp.send(apiError("Requested Quote Record not Found"))            
            resp.send(apiSuccess({id: req.params.id, ...req.body}))
           
        }
    )
})


//SELECT * FROM quote q Join favourite favq on favq.userId = q.userId WHERE q.userId=?"
router.get("/favQuote/:userId", (req, resp) => {
	const sql = `
    	SELECT q.*, true as liked
		FROM favourite fav
		JOIN quote q ON fav.quoteId = q.id
		WHERE fav.userId = ?
	`;

	db.query(sql, [req.params.userId], (err, results) => {
		if (err) return resp.send(apiError(err));
		if (results.length === 0) return resp.send(apiError("No favourite quotes found."));
		resp.send(apiSuccess(results));
	});
});
// POST: Mark a quote as favorite (only if not already favorited)
router.post("/favQuote", (req, res) => {
  const { userId, quoteId } = req.body;

  if (!userId || !quoteId) {
    return res.send(apiError("Missing userId or quoteId"));
  }
  const sql = `INSERT INTO favourite (userId, quoteId) VALUES (?, ?)`;
  db.query(sql, [userId, quoteId], (err, result) => {
    if (err) {
      // Duplicate entry
      if (err.code === "ER_DUP_ENTRY") {
        return res.send(apiError("You already marked this quote as favorite."));
      }
      return res.send(apiError(err));
    }
    res.send(apiSuccess("Quote marked as favorite"));
  });
});


router.delete('/unmark-favorite/:userId/:quoteId', (req, res) => {
  const { userId, quoteId } = req.params;
 if (!userId || !quoteId) {
    return res.send(apiError("Missing userId or quoteId"));
   }
  const sql = 'DELETE FROM favourite WHERE userId = ? AND quoteId = ?';
  db.query(sql, [userId, quoteId], (err, result) => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Unmarked as favorite successfully' });
  });
});


module.exports = router

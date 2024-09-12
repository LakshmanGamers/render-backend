import { Strategy } from "passport-local";
import passport from "passport";
import pg from "pg";


passport.use(new Strategy(

    async (email , password , done) => {
        try{
             const query = "select * from users where email=$1"
            const value = [email];
            const result = await db.query(query, value);
            const user = result.rows[0];
          
            if(!user){
            //   return res.status(404).json({ result: "", error: "User not found" });
            return done(null,false,{result : "" , error : "User not found"});
            }
            const hashedPassword = result.rows[0].password;
          const inputPassword = password;
            if (!(await bcrypt.compare(inputPassword, hashedPassword))) {
            //   return res.status(401).json({ result: "", error: "Invalid password" });
            return done(null,false,{result : "" , error : "Invalid password"});
            }
            return done(null,user);
            }
             
            // res.status(200).json({ result: "Login successful", error: "" });      
          
        catch(err){
            return done(error);
        }
    }

));
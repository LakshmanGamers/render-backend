import mongoose from "mongoose";
import Board  from "../models/UserModel.js";

export async function addTask(req,res){
    try{
        
        const data = req.body;
        console.log(data);
        const boardId = data._id;
        delete data._id;
        const board = await Board.updateOne(
            {_id : boardId },
            {
                $set : data
            }
        );
        console.log(board , data);
        res.json( data);
    }
    catch(error){
        res.status(400).json(error.message);
    }
}

export async function createHomeBoard(name , userId){
   
        try{
        
          const obj = {
            "name" : name,
            "userId" : userId,
            "tasks": {},
            "columns": {},
            "columnOrder": []
          }
      
        console.log(obj)
          const board = new Board(obj);
          const savedboard = await board.save();
      
          return res.json(savedboard);
        }
        catch(err){
            console.error(err);
        
          res.status(400).json({error:err.message});
        }
      
      
}


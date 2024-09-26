import mongoose from "mongoose";
import Board  from "../models/UserModel.js";


export async function updateBoard(req,res){
      
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


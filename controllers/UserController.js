import mongoose  from "mongoose";
import UserModel from "../models/UserModel.js";
import Board from "../models/UserModel.js";

async function fetch(req,res){
    
try{
    const uId = req.params.id;
    const result =  await Board.find({userId : uId});
    res.json(result);
}
catch(err){
    res.status(500).json({error:err.message});
}
   
}

async function create(req,res){
try{

    // const {name , age} = req.body;
    console.log(req.body);
    const user = new Board(req.body);
    const savedUser = await user.save();

    res.json(savedUser);
}
catch(err){
    res.status(400).json({error:err.message+ "hi"});
}
}



const updateColumnOrder = async (boardId, newColumnOrder) => {
    try {
      // Update the column order for the specified board
      const name= "columnOrder";
      await Board.updateOne(
        { id: boardId }, // Find the board by ID
        { $set: { [name]: newColumnOrder } } // Set the new column order
      );
     
    } catch (err) {
      console.error('Error updating column order:', err);
    }
  };
  
 
async function updateCol(req,res){
 // Usage example
 try{
    const boardId = 'board-1';
    const newColumnOrder = ['column-1', 'column-2']; // New desired order
    
    updateColumnOrder(boardId, newColumnOrder);

    res.json({ message: 'Column order updated successfully' });
 }
 catch (err) {
 
res.json({ message: 'Error updating column order:', err });
}
}


async function addBoard(req,res){
  try{
    const {name , userId} = req.body;
    const obj = {
      "name" : name,
      "userId" : userId,
      "tasks": {},
      "columns": {},
      "columnOrder": []
    }

    const board = new Board(obj);
    const savedboard = await board.save();

    return res.json(savedboard);
  }
  catch(err){
    res.status(400).json({error:err.message});
  }

}

export  {create , fetch , updateCol , addBoard};
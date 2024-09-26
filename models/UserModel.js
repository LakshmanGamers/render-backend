import mongoose  from "mongoose";

const userSchema = new mongoose.Schema({
    name : {
        type : String ,
        required : true 
    },
    age : {
        type : Number ,
        required : true
    }
})


// Define a schema for tasks
const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  description: String,
  dueDate: { type: String  }, // Store as Date
});

// Define a schema for columns
const ColumnSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  taskIds: [{ type: String }] // Array of task IDs
});

// Define a schema for boards
const BoardSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  tasks: { type: Map, of: TaskSchema }, // Map of tasks
  columns: { type: Map, of: ColumnSchema }, // Map of columns
  columnOrder: [{ type: String }], // Array of column IDs
  userId: { type: String, required: true } // Add userId to associate the board with a user
});

// Create the model
const Board = mongoose.model('boards', BoardSchema);



export default Board;
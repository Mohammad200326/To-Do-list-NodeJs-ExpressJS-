const http = require('http')
const app = require('./app')
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const express = require('express');

const server = http.createServer(app)

const port = 5000;
server.listen(port, () => {
    console.log("Server is running now");
})

app.use(express.json());

// Database Connection
const _uri = 'mongodb+srv://Mohammad:Mohammad2003@cluster0.u9c67bm.mongodb.net/To-Do_list?retryWrites=true&w=majority';

const dbConnection = (collection, cb) => {
    MongoClient.connect(_uri)
    .then(async (client) => {
        const db = client.db('To-Do_list').collection(collection);
        await cb(db);
        client.close();
    })
    .catch();
}
// Register
app.post('/register', async (req, res) => {
    try {
        dbConnection('users', async (collection) => {
            const user = await collection.findOne({ email: req.body.email });
            if(!user) {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
                const userWithHashedPassword = {
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    password: hashedPassword
                };
                await collection.insertOne(userWithHashedPassword);
                res.status(200).json({ message: 'User Registered Successfully' });
            } else {
                res.status(400).json({ message: 'This Email Already Exists' });
            }
        });
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: 'Registration failed' });
    }
});
// Login
app.post('/login', (req, res) => {
    try {
        dbConnection('users', async (collection) => {
            const user = await collection.findOne({ email: req.body.email });
            if(user) {
                const passwordMatch = await bcrypt.compare(req.body.password, user.password);
                if(passwordMatch) {
                    res.status(200).json({messege: 'Login Successfully'});
                } else {
                    res.status(401).json({messege: 'Invalid Password'});
                }
                res.status(200).json({ message: 'User Found' });
                
            } else {
                res.status(404).json({ message: 'User Not Found' });
            } 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Login Failed' });
    }
})
// Get All Tasks 
app.get('/tasks', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            const tasksList = await collection.find({}).toArray();
            res.status(200).json(tasksList);
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Failed' });
    }
})

// Insert Task
app.get('/add', (req, res) => {
    try {
    dbConnection('tasks', async (collection) => {
        const newTask = {
            rank: 1,
            content: req.query.content,
            done: false,
            cancel: false,
            date_created: new Date().toLocaleString(),
            subtasks: []
        }
        await collection.insertOne(newTask);
        res.status(200).json({message: 'Task Added'})
    })
    } catch(error) {
        res.status(500).json({message: 'Fail To Add'})  
    }
})
// Delete Task
app.get('/delete', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            await collection.deleteOne({rank: parseInt(req.query.rank)});
            res.status(200).json({message: "Delete Successfull"});
        });
    } catch(error) {
        res.status(500).json({message: "Delete Failed"});
    }
})
// Edit Task Rank
app.get('/rank', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            const taskOne = await collection.findOne({rank: parseInt(req.query.oldRank)});
            const taskTwo = await collection.findOne({rank: parseInt(req.query.newRank)});
            const updatedTaskOne = { $set: {rank: taskTwo.rank} };
            const updatedTaskTwo = { $set: {rank: taskOne.rank} };
            await collection.updateOne({ _id: taskOne._id }, updatedTaskOne);
            await collection.updateOne({ _id: taskTwo._id }, updatedTaskTwo);
            res.status(200).json({message: 'Rank Changed Successfully'});
        })
    } catch(error) {
        res.status(500).json({message: "Not Changed Rank"});
    }
})
// Update Task Content
app.get('/content', (req, res) => {
    try{
    dbConnection('tasks', async (collection) => {
        const task = await collection.findOne({rank: parseInt(req.query.rank)});
        const updatedContent = {$set: {content: req.query.content}};
        await collection.updateOne({_id: task._id}, updatedContent);
        res.status(200).json({message: 'Content Changed Successfully'});
    })
    } catch(error) {
    res.status(500).json({message: "Not Changed Content"});
    }
});
// Done And Date Done
app.get('/done', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            const task = await collection.findOne({rank: parseInt(req.query.rank)});
            const updatedTask = { $set: { 
                done: true,
                date_done: new Date().toLocaleString()
            } };
            await collection.updateOne({ _id: task._id }, updatedTask);
            res.status(200).json({message: 'Done'});
        })
        } catch(error) {
        res.status(500).json({message: "Not Done"});
        }
}); 
// Cancel
app.get('/cancel', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            const task = await collection.findOne({rank: parseInt(req.query.rank)});
            const updatedTask = { $set: { cancel: !task.cancel } };
            await collection.updateOne({ _id: task._id }, updatedTask);
            res.status(200).json({message: 'Cancel Done'});
        })
    } catch(error) {
        res.status(500).json({message: 'Cancel Not Done'})
    }
});
// Insert Sub Task
app.get('/subTask/add', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            const task = await collection.findOne({rank: parseInt(req.query.rank)});
            const newSubTask = {
                    Parent_id: task._id,
                    _id: new ObjectId(),
                    rank: 2,
                    content: req.query.content,
                    done: false,
                    cancel: false,
                    date_created: new Date().toLocaleDateString()
                };
            await collection.updateOne(
                {_id: task._id},
                {$push: {subtasks: newSubTask}}
            );
            res.status(200).json({messege: 'Sub Task Is Added'})
        })
    } catch(error) {
        res.status(500).json({message: 'Failed To Add Sub Task'})
    }
});
//Delete Sub Task
app.get('/subTask/delete', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            const task = await collection.findOne({rank: parseInt(req.query.rank)});
            const subTaskRank = parseInt(req.query.subTaskRank);
            await collection.updateOne(
                {_id: task._id},
                {$pull: {subtasks: {rank: subTaskRank}}}
            );
            res.status(200).json({message: 'Sub Task Deleted'});
        })
    } catch (error) {
        res.status(500).json({messege: 'Sub Task Not Deleted'})
    }
});
// Edit Sub Task Rank
app.get('/subTask/rank', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            const parentTask = await collection.findOne({rank: parseInt(req.query.rank)});
            const subTaskIndex1 = parentTask.subtasks.findIndex(subtask => subtask.rank === parseInt(req.query.rank1));
            const subTaskIndex2 = parentTask.subtasks.findIndex(subtask => subtask.rank === parseInt(req.query.rank2));
            [parentTask.subtasks[subTaskIndex1].rank, parentTask.subtasks[subTaskIndex2].rank] = [parentTask.subtasks[subTaskIndex2].rank, parentTask.subtasks[subTaskIndex1].rank];
            await collection.updateOne({ _id: parentTask._id }, { $set: { subtasks: parentTask.subtasks } });
            res.status(200).json({ message: 'Subtask Ranks Swapped Successfully' });
        })
    } catch (error) {
        res.status(500).json({ message: 'Failed to Swap Subtask Ranks' });
    }
});
// Update Sub Task Content
app.get('/subTask/content', (req, res) => {
    try{
    dbConnection('tasks', async (collection) => {
        const parentTask = await collection.findOne({rank: parseInt(req.query.rank)});
        const subTaskIndex = parentTask.subtasks.findIndex(subtask => subtask.rank === parseInt(req.query.subTaskRank));
        parentTask.subtasks[subTaskIndex].content = req.query.content;
        await collection.updateOne({ _id: parentTask._id }, { $set: { subtasks: parentTask.subtasks } });
        res.status(200).json({message: 'Sub Task Content Changed Successfully'});
    })
    } catch(error) {
    res.status(500).json({message: "Not Changed Sub Task Content"});
    }
});
// Sub Task Done And Date Done
app.get('/subTask/done', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            const task = await collection.findOne({rank: parseInt(req.query.rank)});
            const subTaskIndex = task.subtasks.findIndex(subtask => subtask.rank === parseInt(req.query.subTaskRank));
            task.subtasks[subTaskIndex].done = true;
            task.subtasks[subTaskIndex].date_done = new Date().toLocaleString();
            await collection.updateOne({ _id: task._id }, { $set: { subtasks: task.subtasks } });
            res.status(200).json({ message: 'Subtask Marked as Done' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to Mark Subtask as Done' });
    }
});
// Cancel Sub Task
app.get('/subTask/cancel', (req, res) => {
    try {
        dbConnection('tasks', async (collection) => {
            const task = await collection.findOne({rank: parseInt(req.query.rank)});
            const subTaskIndex = task.subtasks.findIndex(subtask => subtask.rank === parseInt(req.query.subTaskRank));
            task.subtasks[subTaskIndex].cancel = !task.subtasks[subTaskIndex].cancel;
            await collection.updateOne({ _id: task._id }, { $set: { subtasks: task.subtasks } });
            res.status(200).json({ message: 'Subtask Cancellation Done' });
        })
    }catch (error) {
        res.status(500).json({ message: 'Failed to Subtask Cancellation' });
    }
});
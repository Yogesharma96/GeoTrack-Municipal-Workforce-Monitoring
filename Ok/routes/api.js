const express = require('express');
const router = express.Router();
const Worker = require('../models/Worker');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');

// Authentication (Admin or Worker)
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if(phone === 'admin' && password === 'admin') {
      return res.json({ success: true, worker: { _id: 'admin_id', role: 'admin', name: 'Admin Portal' }});
    }
    const worker = await Worker.findOne({ phone, password });
    if (!worker) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dashboard Stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalWorkers = await Worker.countDocuments();
    const tasks = await Task.find();
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Verified').length;
    const today = new Date().toISOString().split('T')[0];
    const presentToday = await Attendance.countDocuments({ date: today });
    
    res.json({ success: true, stats: { totalWorkers, pendingTasks, completedTasks, presentToday, totalTasks: tasks.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- WORKER ROUTES ----------
router.get('/workers', async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });
    res.json({ success: true, workers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/workers', async (req, res) => {
  try {
    const worker = new Worker(req.body);
    await worker.save();
    res.json({ success: true, worker });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/workers/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, worker });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// ---------- TASK ROUTES ----------
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/tasks', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.json({ success: true, task });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, task });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
});

// ---------- ATTENDANCE ROUTES ----------
router.get('/attendance', async (req, res) => {
  try {
    const logs = await Attendance.find().populate('worker', 'name phone zone').sort({ createdAt: -1 });
    res.json({ success: true, logs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

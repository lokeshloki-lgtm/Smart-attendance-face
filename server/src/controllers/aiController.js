import axios from 'axios';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-20b';

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message',
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service not configured',
      });
    }

    // Prepare context based on user role
    let context = 'You are AttendanceAI, a helpful assistant for attendance management. ';

    if (userRole === 'ADMIN') {
      // Get admin-level data
      const allUsers = await User.find({ isActive: true });
      const todayAttendance = await Attendance.find({
        date: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999),
        },
      }).populate('userId');

      const presentToday = todayAttendance.filter((a) => a.status === 'Present').length;
      const absentToday = todayAttendance.filter((a) => a.status === 'Absent').length;
      const lateToday = todayAttendance.filter((a) => a.status === 'Late').length;

      context += `
Current system data:
- Total users: ${allUsers.length}
- Today's attendance: ${todayAttendance.length} records
- Present today: ${presentToday}
- Absent today: ${absentToday}
- Late today: ${lateToday}

Provide helpful insights and analysis based on the attendance data. Be concise and practical.`;
    } else {
      // Get user-level data
      const userAttendance = await Attendance.find({ userId });
      const presentCount = userAttendance.filter((a) => a.status === 'Present').length;
      const absentCount = userAttendance.filter((a) => a.status === 'Absent').length;
      const lateCount = userAttendance.filter((a) => a.status === 'Late').length;
      const percentage =
        userAttendance.length > 0
          ? (((presentCount + lateCount) / userAttendance.length) * 100).toFixed(2)
          : 0;

      context += `
User attendance data:
- Total records: ${userAttendance.length}
- Present: ${presentCount}
- Absent: ${absentCount}
- Late: ${lateCount}
- Attendance percentage: ${percentage}%

Provide helpful insights about your attendance. Be concise and supportive.`;
    }

    // Call Groq API
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: context,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const aiMessage = response.data.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: {
        userMessage: message,
        aiMessage,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('AI chat error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'AI service authentication failed',
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'Too many AI requests. Please try again later.',
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get AI response',
    });
  }
};

export const generateAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userRole = req.user.role;

    let attendance;

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (userRole === 'ADMIN') {
        attendance = await Attendance.find({
          date: { $gte: start, $lte: end },
        }).populate('userId');
      } else {
        attendance = await Attendance.find({
          userId: req.user._id,
          date: { $gte: start, $lte: end },
        });
      }
    } else {
      if (userRole === 'ADMIN') {
        attendance = await Attendance.find().populate('userId');
      } else {
        attendance = await Attendance.find({ userId: req.user._id });
      }
    }

    if (!attendance.length) {
      return res.status(200).json({
        success: true,
        data: {
          summary: 'No attendance records found for the specified period.',
        },
      });
    }

    const present = attendance.filter((a) => a.status === 'Present').length;
    const absent = attendance.filter((a) => a.status === 'Absent').length;
    const late = attendance.filter((a) => a.status === 'Late').length;
    const total = attendance.length;

    const summaryPrompt = userRole === 'ADMIN'
      ? `Summarize the following attendance statistics for an admin report. Be concise and actionable:
Total records: ${total}
Present: ${present}
Absent: ${absent}
Late: ${late}
Percentage (Present + Late): ${((present + late) / total * 100).toFixed(2)}%`
      : `Summarize the following attendance statistics for a user. Be supportive and constructive:
Total records: ${total}
Present: ${present}
Absent: ${absent}
Late: ${late}
Your attendance percentage: ${((present + late) / total * 100).toFixed(2)}%`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are AttendanceAI, providing concise attendance summaries.',
          },
          {
            role: 'user',
            content: summaryPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const summary = response.data.choices[0].message.content;

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          total,
          present,
          absent,
          late,
          percentage: ((present + late) / total * 100).toFixed(2),
        },
        summary,
      },
    });
  } catch (error) {
    console.error('Generate summary error:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate summary',
    });
  }
};

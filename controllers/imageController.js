import axios from "axios";
import userModel from "../models/userModel.js";
import FormData from "form-data";
import https from "https";

export const generateImage = async (req, res) => {
  try {
    const { userId, prompt } = req.body;

    const user = await userModel.findById(userId);

    if (!user || !prompt) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (user.creditBalance <= 0) {
      return res.json({
        success: false,
        message: "No Credit Balance",
        creditBalance: user.creditBalance,
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const agent = new https.Agent({
      rejectUnauthorized: false, // Only for development
    });

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "x-api-key": process.env.CLIPDROP_API,
        },
        responseType: "arraybuffer",
        httpsAgent: agent, // ✅ Apply the agent here
        timeout: 30000, // Optional: to avoid premature network errors
      }
    );

    const base64Image = Buffer.from(data, "binary").toString("base64");
    const resultImage = `data:image/png;base64,${base64Image}`;

    await userModel.findByIdAndUpdate(user._id, {
      creditBalance: user.creditBalance - 1,
    });

    res.json({
      success: true,
      message: "Image Generated",
      creditBalance: user.creditBalance - 1,
      resultImage,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


# Final Steps: Deploying on Vercel (Visual Guide)

You have all the files ready on GitHub. Now for the last part.

### Step 1: Go to Your Vercel Dashboard

*   Open your web browser and go to: [https://vercel.com/dashboard](https://vercel.com/dashboard)

### Step 2: Add a New Project

*   Click the **"Add New..."** button and select **"Project"**.



---

### Step 3: Import Your GitHub Repository

*   Vercel will show you a list of your GitHub projects.
*   Find the `my-pdf-extractor-app` repository you created.
*   Click the **"Import"** button next to it.



---

### Step 4: Add Your Secret API Key

This is the most important step. Vercel will automatically detect all the settings, so you only need to add your key.

1.  Find the section named **"Environment Variables"**.
2.  Click to expand it.
3.  You will see a form with "Name" and "Value".
    *   In the **Name** field, type exactly: `API_KEY`
    *   In the **Value** field, **paste your own secret API key** that you get from Google AI Studio.

It should look exactly like this:



---

### Step 5: Deploy!

*   Click the **"Deploy"** button.



---

### Step 6: Success!

*   That's it! Vercel will start building your website. It might take a minute or two.
*   When it's finished, you will see a screen with confetti.
*   Click **"Continue to Dashboard"** or one of the screenshots of your new site to visit your live website!



Your website is now live on the internet for anyone to use, and your API key is kept safe and secure on Vercel's servers.

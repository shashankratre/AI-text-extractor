
# How to Add Your API Key in Vercel (A Simple Visual Guide)

You have already connected your GitHub project to Vercel. You should now be on the **"Configure Project"** screen.

### Step 1: Find the "Environment Variables" Section

Scroll down the page until you see a section named **Environment Variables**. It looks like this:



### Step 2: Enter the Name and Value

You will see two empty boxes: one for the **Name** and one for the **Value**.

1.  **In the `Name` box:**
    *   Type `API_KEY`
    *   It **must** be in all capital letters with an underscore.

2.  **In the `Value` box:**
    *   **Paste your secret API key** that you copied from Google AI Studio.

It should look exactly like this before you click "Add":

```
+-----------------------------------------------------------------+
| Environment Variables                                           |
+-----------------------------------------------------------------+
|                                                                 |
|   Name                      Value                               |
|   +---------------------+   +--------------------------------+  |
|   |       API_KEY       |   | YOUR_SECRET_KEY_PASTED_HERE... |  |
|   +---------------------+   +--------------------------------+  |
|                                                                 |
|                                                     [ Add ]     |
+-----------------------------------------------------------------+
```

### Step 3: Click "Add"

*   Click the **Add** button. Your key is now saved for this project.



### Step 4: Click "Deploy"

*   Now that the key is added, scroll to the bottom of the page and click the **Deploy** button.



---

That's it!

You have successfully given your secret key to Vercel in a secure way. Now, when your website runs, Vercel will provide the key to your code without anyone else ever seeing it.

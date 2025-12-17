# 📚 Component Documentation

Complete reference for all reusable components in the frontend.

## Header Component

**File**: `src/components/Header.jsx`

The main navigation header displayed on all authenticated pages.

### Usage
```jsx
import Header from "../components/Header";

export default function MyPage() {
  return (
    <div>
      <Header />
      {/* Page content */}
    </div>
  );
}
```

### Features
- Displays user name and role
- Logout button
- Responsive design
- Logo and branding

---

## FormInput Component

**File**: `src/components/FormInput.jsx`

Reusable text input field with label and styling.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Input label text |
| name | string | - | Input name attribute |
| type | string | "text" | Input type (text, email, password, etc) |
| placeholder | string | - | Input placeholder text |
| value | string | - | Input value |
| onChange | function | - | Change event handler |
| required | boolean | false | Mark as required field |
| disabled | boolean | false | Disable input |

### Usage
```jsx
import FormInput from "../components/FormInput";

export default function MyForm() {
  const [email, setEmail] = useState("");

  return (
    <FormInput
      label="Email Address"
      name="email"
      type="email"
      placeholder="user@example.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
    />
  );
}
```

---

## FormSelect Component

**File**: `src/components/FormSelect.jsx`

Reusable dropdown select field with label and styling.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Select label text |
| name | string | - | Select name attribute |
| value | string | - | Selected value |
| onChange | function | - | Change event handler |
| options | array | - | Array of {label, value} objects |
| required | boolean | false | Mark as required field |

### Usage
```jsx
import FormSelect from "../components/FormSelect";

export default function MyForm() {
  const [role, setRole] = useState("student");

  return (
    <FormSelect
      label="Select Role"
      name="role"
      value={role}
      onChange={(e) => setRole(e.target.value)}
      options={[
        { label: "Student", value: "student" },
        { label: "Teacher", value: "teacher" },
      ]}
    />
  );
}
```

---

## Button Component

**File**: `src/components/Button.jsx`

Versatile button component with multiple variants and states.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | node | - | Button text/content |
| onClick | function | - | Click event handler |
| type | string | "button" | Button type (button, submit, reset) |
| variant | string | "primary" | Button style (primary, secondary, danger) |
| disabled | boolean | false | Disable button |
| fullWidth | boolean | false | Make button full width |
| loading | boolean | false | Show loading state |

### Variants
- **primary**: Blue background, main action button
- **secondary**: Gray background, secondary action
- **danger**: Red background, destructive actions

### Usage
```jsx
import Button from "../components/Button";

export default function MyForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    // Do something
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleSubmit} loading={loading} fullWidth>
        Submit Form
      </Button>

      <Button variant="secondary">
        Cancel
      </Button>

      <Button variant="danger">
        Delete
      </Button>
    </div>
  );
}
```

---

## Card Component

**File**: `src/components/Card.jsx`

Container component for grouping related content.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Card title (optional) |
| children | node | - | Card content |
| className | string | "" | Additional CSS classes |

### Usage
```jsx
import Card from "../components/Card";

export default function MyPage() {
  return (
    <>
      <Card title="Statistics">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold">156</p>
          </div>
          {/* More stats */}
        </div>
      </Card>

      <Card className="mt-4">
        <p>Content without title</p>
      </Card>
    </>
  );
}
```

---

## Alert Component

**File**: `src/components/Alert.jsx`

Auto-dismissing alert message for notifications.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| message | string | - | Alert message text |
| type | string | "error" | Alert type (error, success) |
| onClose | function | - | Called when alert closes |

### Features
- Auto-dismisses after 4 seconds
- Color-coded by type (red for error, green for success)
- Call onClose handler when dismissed

### Usage
```jsx
import Alert from "../components/Alert";
import { useState } from "react";

export default function MyForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <>
      {error && (
        <Alert
          message={error}
          type="error"
          onClose={() => setError("")}
        />
      )}

      {success && (
        <Alert
          message={success}
          type="success"
          onClose={() => setSuccess("")}
        />
      )}
    </>
  );
}
```

---

## LoadingSpinner Component

**File**: `src/components/LoadingSpinner.jsx`

Animated loading spinner for async operations.

### Usage
```jsx
import LoadingSpinner from "../components/LoadingSpinner";

export default function MyPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return <div>{/* Show data */}</div>;
}
```

---

## ProtectedRoute Component

**File**: `src/components/ProtectedRoute.jsx`

Wrapper component that enforces role-based access control.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | node | - | Content to protect |
| allowedRoles | array | - | Array of allowed roles |

### Usage
```jsx
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Behavior
- Checks if user is logged in
- Checks if user has allowed role
- Redirects to login if not authorized

---

## Complete Example

Here's a complete form example using multiple components:

```jsx
import { useState } from "react";
import Header from "../components/Header";
import Card from "../components/Card";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Button from "../components/Button";
import Alert from "../components/Alert";

export default function CreateUserForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // API call
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to create user");

      setSuccess("User created successfully!");
      setForm({ name: "", email: "", password: "", role: "student" });
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Card title="Create New User">
          {error && (
            <Alert
              message={error}
              type="error"
              onClose={() => setError("")}
            />
          )}

          {success && (
            <Alert
              message={success}
              type="success"
              onClose={() => setSuccess("")}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Email"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />

            <FormInput
              label="Password"
              name="password"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <FormSelect
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              options={[
                { label: "Student", value: "student" },
                { label: "Teacher", value: "teacher" },
              ]}
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
            >
              {loading ? "Creating..." : "Create User"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
```

---

## Styling with Tailwind CSS

All components use Tailwind CSS classes. You can extend styling:

```jsx
<Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
  <Button className="text-lg">Extended Button</Button>
</Card>
```

## Theme Customization

Edit `tailwind.config.js` to customize:

```js
export default {
  theme: {
    extend: {
      colors: {
        primary: "#your-color",
      },
      spacing: {
        // Add custom spacing
      },
    },
  },
}
```

---

**Version**: 1.0.0  
**Last Updated**: December 2025

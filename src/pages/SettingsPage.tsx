import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Bell, Shield, Palette, Globe, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function SettingsPage() {
  const { user, logout } = useAuthStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Profile
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <p className="text-lg">{user?.name || 'User'}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <p className="text-lg">{user?.email || 'user@example.com'}</p>
              </div>
              <Button variant="outline">Edit Profile</Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette size={20} />
              Preferences
            </CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Switch to dark theme</p>
              </div>
              <Button variant="outline" size="sm">Coming Soon</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Language</p>
                <p className="text-sm text-muted-foreground">Choose your preferred language</p>
              </div>
              <Button variant="outline" size="sm">English</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Currency</p>
                <p className="text-sm text-muted-foreground">Set your default currency</p>
              </div>
              <Button variant="outline" size="sm">USD</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} />
              Notifications
            </CardTitle>
            <CardDescription>Manage your alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Budget Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when approaching limits</p>
              </div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Security
            </CardTitle>
            <CardDescription>Protect your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Change Password</Button>
            <Button variant="outline">Enable 2FA</Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={logout}
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

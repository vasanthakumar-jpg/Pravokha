import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/Card";
import { Switch } from "@/ui/Switch";

interface NotificationSettingsProps {
  preferences: any;
  updatePreferences: (prefs: any) => void;
}

export const NotificationSettings = ({ preferences, updatePreferences }: NotificationSettingsProps) => {
  if (!preferences) {
    return (
      <Card className="border-none shadow-lg">
         <CardContent className="p-6">
           <div className="flex items-center justify-center p-4">Loading preferences...</div>
         </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-xl md:text-2xl">Notifications</CardTitle>
        <CardDescription>Choose what you want to be notified about.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:gap-6 p-4 md:p-6 pt-0">
        {[
          { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive daily digests and newsletters' },
          { key: 'order_updates', label: 'Order Updates', desc: 'Get notified when your order status changes' },
          { key: 'marketing_emails', label: 'Marketing Emails', desc: 'Receive special offers and promotions' },
          { key: 'sms_notifications', label: 'SMS Notifications', desc: 'Get important updates via SMS' },
        ].map((item) => (
          <div key={item.key} className="flex items-start md:items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition">
            <div className="flex-1 space-y-1">
              <p className="text-sm md:text-base font-medium leading-none">{item.label}</p>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
            <Switch 
              checked={preferences[item.key] || false} 
              onCheckedChange={(c) => updatePreferences({ [item.key]: c })}
              className="shrink-0 mt-0.5 md:mt-0"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

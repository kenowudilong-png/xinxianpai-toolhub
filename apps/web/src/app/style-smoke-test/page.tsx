import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function StyleSmokeTestPage() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>StyleSmokeTest</CardTitle>
              <CardDescription>验证 Tailwind 与 shadcn/ui 基础样式是否正常生效。</CardDescription>
            </div>
            <Badge>shadcn/ui</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button>默认按钮</Button>
            <Button variant="outline">描边按钮</Button>
            <Button variant="secondary">次级按钮</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>组件</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Button</TableCell>
                <TableCell><Badge variant="secondary">正常</Badge></TableCell>
                <TableCell>应显示圆角、背景色、hover 状态。</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Card / Table / Badge</TableCell>
                <TableCell><Badge variant="outline">正常</Badge></TableCell>
                <TableCell>应显示边框、间距、表格分隔线。</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}

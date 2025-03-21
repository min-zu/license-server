import { Button } from "@mui/material";

export default function LicenseAddModal({ close }: { close: () => void }) {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-1/2 h-1/2 bg-white rounded-md">
        <h1>Hello, admin Page</h1>
        <div className="flex justify-end">
          <Button 
            onClick={close}
            variant="contained"
            color="primary"
          >
            X
          </Button>
        </div>
      </div>
    </div>
  )
}
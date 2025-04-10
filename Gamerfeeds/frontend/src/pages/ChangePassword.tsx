import ChangePasswordCard from "../components/ChangePasswordCard";

export default function ChangePassword() {
  return (
    <div className="max-w-7xl mx-auto min-h-screen flex flex-col z-10">
      <h1 className="div-header font-[Black_Ops_one] text-3xl mt-25">
        Change Password
      </h1>
      <div className="flex-grow flex items-center justify-center">
        <ChangePasswordCard />
      </div>
    </div>
  );
}
